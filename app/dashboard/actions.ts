"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function markApplied(jobId: string): Promise<{
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