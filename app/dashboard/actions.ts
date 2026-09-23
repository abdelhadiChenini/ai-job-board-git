"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const profile = await prisma.expertProfile.findUnique({
    where: { userId: session.user.id },
    select: { savedJobs: true },
  });

  if (!profile) {
    return { ok: false, error: "Profile not found." };
  }

  const currentSaved = Array.isArray(profile.savedJobs)
    ? (profile.savedJobs as unknown[]).filter(
        (id): id is string => typeof id === "string",
      )
    : [];

  if (!currentSaved.includes(jobId)) {
    return { ok: true };
  }

  await prisma.expertProfile.update({
    where: { userId: session.user.id },
    data: { savedJobs: currentSaved.filter((id) => id !== jobId) },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
