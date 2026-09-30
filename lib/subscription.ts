import { prisma } from "@/lib/prisma";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const FREE_DAILY_APPLICATION_LIMIT = 3;
export const EARLY_ACCESS_WINDOW_HOURS = 48;
export const EARLY_ACCESS_WINDOW_MS = EARLY_ACCESS_WINDOW_HOURS * 60 * 60 * 1000;

export type Plan = "FREE" | "PRO";

export type PlanChangeSource = "admin" | "webhook" | "reconcile";

export type ApplyPlanChangeResult =
  | {
      ok: true;
      changed: boolean;
      /**
       * Set when the change was intentionally not applied because a guard did
       * not hold — e.g. a webhook for a subscription the user has since
       * replaced. Callers should treat this as "nothing to do", not as a
       * failure: retrying cannot change the outcome and would loop forever.
       */
      skipReason?: "subscription_mismatch";
    }
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
 * Single write path for plan changes, shared by the admin override, the PayPal
 * webhook and the reconciliation job so they can never drift apart. Writes the
 * user row and its audit row in one transaction.
 *
 * Two behaviours matter for correctness:
 *
 * - A no-op plan change is success without logging. This is also what makes
 *   redelivered webhooks idempotent.
 * - `requireSubscriptionId` is an optimistic-concurrency guard evaluated inside
 *   the same transaction as the read. A customer who cancels and re-subscribes
 *   will receive an `EXPIRED` webhook for the *old* subscription; without this
 *   guard that stale event would revoke the access they just paid for. The guard
 *   compares the user's stored id to the id in the event, so only the
 *   subscription that actually granted access can change the plan.
 */
export async function applyPlanChange(params: {
  userId: string;
  plan: Plan;
  changedBy: PlanChangeSource;
  changedById?: string | null;
  paypalSubscriptionId?: string | null;
  requireSubscriptionId?: string | null;
}): Promise<ApplyPlanChangeResult> {
  const { userId, plan, changedBy, changedById = null } = params;

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, paypalSubscriptionId: true },
  });

  if (!previous) {
    return { ok: false, error: "User not found." };
  }

  if (
    params.requireSubscriptionId !== undefined &&
    previous.paypalSubscriptionId !== params.requireSubscriptionId
  ) {
    return { ok: true, changed: false, skipReason: "subscription_mismatch" };
  }

  const oldPlan = normalizePlan(previous.plan);
  const planChanged = oldPlan !== plan;
  const subscriptionIdChanged =
    params.paypalSubscriptionId !== undefined &&
    previous.paypalSubscriptionId !== params.paypalSubscriptionId;

  if (!planChanged && !subscriptionIdChanged) {
    return { ok: true, changed: false };
  }

  // Interactive form rather than the array form: Prisma's generated types pin
  // the array form to a two-element tuple, and the log is conditional here.
  // Either way the user row and its audit row commit together or not at all.
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(planChanged ? { plan } : {}),
        ...(params.paypalSubscriptionId !== undefined
          ? { paypalSubscriptionId: params.paypalSubscriptionId }
          : {}),
      },
    });

    // Clearing a stale subscription id is not itself a plan change, so it
    // writes the user row without adding a FREE -> FREE audit row.
    if (planChanged) {
      await tx.planChangeLog.create({
        data: { userId, oldPlan, newPlan: plan, changedBy, changedById },
      });
    }
  });

  return { ok: true, changed: planChanged };
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
