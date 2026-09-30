import { prisma } from "@/lib/prisma";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const FREE_DAILY_APPLICATION_LIMIT = 3;
export const EARLY_ACCESS_WINDOW_HOURS = 48;
export const EARLY_ACCESS_WINDOW_MS = EARLY_ACCESS_WINDOW_HOURS * 60 * 60 * 1000;

export type Plan = "FREE" | "PRO";

export type PlanChangeSource = "admin" | "webhook";

export type ApplyPlanChangeResult =
  | { ok: true; changed: boolean }
  | { ok: false; error: string };

export type ApplyBlockReason = "early_access" | "daily_limit";

/**
 * Server-rendered paywall state, shaped for the client. `countdown` is
 * pre-formatted on the server so client components never need to import this
 * module (which would pull PrismaClient into the browser bundle).
 */
export type ApplyBlockInfo =
  | { reason: "early_access"; unlocksAt: string; countdown: string }
  | { reason: "daily_limit"; used: number; limit: number };

export type ApplyEligibility =
  | { allowed: true }
  | { allowed: false; reason: "early_access"; unlocksAt: Date }
  | {
      allowed: false;
      reason: "daily_limit";
      used: number;
      limit: number;
    };

export function normalizePlan(plan: string | null | undefined): Plan {
  return plan?.toUpperCase() === "PRO" ? "PRO" : "FREE";
}

/**
 * Locks new opportunities for a short window after they go live.
 * `datePosted` is the upstream posting date; bulk-imported rows often share a
 * `createdAt`, so we prefer `datePosted` whenever it is present.
 */
export function getEarlyAccessUnlockAt(job: {
  datePosted: Date | null;
  createdAt: Date;
}): Date {
  const effectivePostedAt = job.datePosted ?? job.createdAt;
  return new Date(effectivePostedAt.getTime() + EARLY_ACCESS_WINDOW_MS);
}

export async function canApplyToJob(
  userId: string,
  opportunityId: string,
): Promise<ApplyEligibility> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (normalizePlan(user?.plan) === "PRO") {
    return { allowed: true };
  }

  const opportunity = await prisma.jobOffer.findUnique({
    where: { id: opportunityId },
    select: { datePosted: true, createdAt: true },
  });

  if (!opportunity) {
    throw new Error(`Opportunity ${opportunityId} not found`);
  }

  const now = Date.now();
  const unlocksAt = getEarlyAccessUnlockAt(opportunity);

  if (now < unlocksAt.getTime()) {
    return { allowed: false, reason: "early_access", unlocksAt };
  }

  const used = await prisma.appliedOpportunity.count({
    where: {
      userId,
      createdAt: { gte: new Date(now - DAY_IN_MS) },
    },
  });

  if (used >= FREE_DAILY_APPLICATION_LIMIT) {
    return {
      allowed: false,
      reason: "daily_limit",
      used,
      limit: FREE_DAILY_APPLICATION_LIMIT,
    };
  }

  return { allowed: true };
}

/**
 * Single write path for plan changes, shared by the admin override and the
 * PayPal webhook so the two can never drift apart. Writes the user row and its
 * audit row in one transaction, and treats a no-op change as success without
 * logging — which also makes redelivered webhooks idempotent.
 */
export async function applyPlanChange(params: {
  userId: string;
  plan: Plan;
  changedBy: PlanChangeSource;
  changedById?: string | null;
  paypalSubscriptionId?: string | null;
}): Promise<ApplyPlanChangeResult> {
  const { userId, plan, changedBy, changedById = null } = params;

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!previous) {
    return { ok: false, error: "User not found." };
  }

  const oldPlan = normalizePlan(previous.plan);

  if (oldPlan === plan) {
    return { ok: true, changed: false };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        ...(params.paypalSubscriptionId !== undefined
          ? { paypalSubscriptionId: params.paypalSubscriptionId }
          : {}),
      },
    }),
    prisma.planChangeLog.create({
      data: { userId, oldPlan, newPlan: plan, changedBy, changedById },
    }),
  ]);

  return { ok: true, changed: true };
}

export function formatUnlockCountdown(unlocksAt: Date, now: Date): string {
  const totalMinutes = Math.max(
    1,
    Math.round((unlocksAt.getTime() - now.getTime()) / 60000),
  );
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
