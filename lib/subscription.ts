import { prisma } from "@/lib/prisma";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const FREE_DAILY_APPLICATION_LIMIT = 3;
export const EARLY_ACCESS_WINDOW_HOURS = 48;

export type Plan = "FREE" | "PRO";

export type ApplyBlockReason = "early_access" | "daily_limit";

export type ApplyEligibility =
  | { allowed: true }
  | { allowed: false; reason: ApplyBlockReason };

export function normalizePlan(plan: string | null | undefined): Plan {
  return plan?.toUpperCase() === "PRO" ? "PRO" : "FREE";
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
    select: { createdAt: true },
  });

  if (!opportunity) {
    throw new Error(`Opportunity ${opportunityId} not found`);
  }

  const now = Date.now();

  if (now - opportunity.createdAt.getTime() < EARLY_ACCESS_WINDOW_HOURS * 60 * 60 * 1000) {
    return { allowed: false, reason: "early_access" };
  }

  const recentApplications = await prisma.appliedOpportunity.count({
    where: {
      userId,
      createdAt: { gte: new Date(now - DAY_IN_MS) },
    },
  });

  if (recentApplications >= FREE_DAILY_APPLICATION_LIMIT) {
    return { allowed: false, reason: "daily_limit" };
  }

  return { allowed: true };
}
