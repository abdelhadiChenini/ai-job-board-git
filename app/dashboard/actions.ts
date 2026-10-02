"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canApplyToJob,
  EARLY_ACCESS_FORBIDDEN_MESSAGE,
  formatUnlockCountdown,
  type ApplyBlockReason,
} from "@/lib/subscription";

export async function saveJob(jobId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!jobId) {
    return { ok: false, error: "Missing job id." };
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in." };
  }

  const existing = await prisma.jobOffer.findUnique({
    where: { id: jobId },
    select: { id: true },
  });

  if (!existing) {
    return { ok: false, error: "Opportunity not found." };
  }

  await prisma.savedOpportunity.upsert({
    where: {
      userId_opportunityId: { userId: session.user.id, opportunityId: jobId },
    },
    update: {},
    create: { userId: session.user.id, opportunityId: jobId },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeSavedJob(jobId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!jobId) {
    return { ok: false, error: "Missing job id." };
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in." };
  }

  await prisma.savedOpportunity.deleteMany({
    where: { userId: session.user.id, opportunityId: jobId },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export type MarkAppliedResult = {
  ok: boolean;
  error?: string;
  blockedReason?: ApplyBlockReason;
  /**
   * Mirrors the HTTP status the equivalent REST endpoint returns, so callers
   * and tests can distinguish "you are not entitled to this" from a transient
   * failure. A server action cannot set a real status code — it resolves with a
   * serialisable value — so the semantic is carried in the payload instead.
   */
  status?: number;
  unlocksAt?: string;
  unlockCountdown?: string;
  used?: number;
  limit?: number;
};

export async function markApplied(jobId: string): Promise<MarkAppliedResult> {
  if (!jobId) {
    return { ok: false, error: "Missing job id." };
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in.", status: 401 };
  }

  const existing = await prisma.jobOffer.findUnique({
    where: { id: jobId },
    select: { id: true },
  });

  if (!existing) {
    return { ok: false, error: "Opportunity not found.", status: 404 };
  }

  const alreadyApplied = await prisma.appliedOpportunity.findUnique({
    where: {
      userId_opportunityId: { userId: session.user.id, opportunityId: jobId },
    },
    select: { id: true },
  });

  // Re-applying is idempotent and must not consume a daily slot, so bypass the
  // gate entirely. Otherwise a job that locks *after* a successful application
  // would strand users who already applied.
  if (alreadyApplied) {
    return { ok: true };
  }

  const eligibility = await canApplyToJob(session.user.id, jobId);

  if (!eligibility.allowed) {
    if (eligibility.reason === "early_access") {
      return {
        ok: false,
        error: EARLY_ACCESS_FORBIDDEN_MESSAGE,
        status: 403,
        blockedReason: "early_access",
        unlocksAt: eligibility.unlocksAt.toISOString(),
        unlockCountdown: formatUnlockCountdown(eligibility.unlocksAt, new Date()),
      };
    }

    return {
      ok: false,
      error: "You have reached your daily application limit.",
      status: 403,
      blockedReason: "daily_limit",
      used: eligibility.used,
      limit: eligibility.limit,
    };
  }

  await prisma.appliedOpportunity.upsert({
    where: {
      userId_opportunityId: { userId: session.user.id, opportunityId: jobId },
    },
    update: {},
    create: { userId: session.user.id, opportunityId: jobId },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}