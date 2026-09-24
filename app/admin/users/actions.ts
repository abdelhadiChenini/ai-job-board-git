"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function approveExpert(userId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized." };
  }

  if (!userId) {
    return { ok: false, error: "Missing user id." };
  }

  const result = await prisma.expertProfile.updateMany({
    where: { userId },
    data: { verificationStatus: "VERIFIED" },
  });

  if (result.count === 0) {
    return { ok: false, error: "Expert profile not found." };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}