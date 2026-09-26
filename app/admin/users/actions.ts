"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

export async function updateExpertStatus(
  userId: string,
  status: "APPROVED" | "REJECTED",
): Promise<{ ok: boolean; error?: string }> {
  const session = await getAdminSession();

  if (!session || session.user?.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized." };
  }

  if (!userId) {
    return { ok: false, error: "Missing user id." };
  }

  if (status !== "APPROVED" && status !== "REJECTED") {
    return { ok: false, error: "Invalid verification status." };
  }

  const result = await prisma.expertProfile.updateMany({
    where: { userId },
    data: { verificationStatus: status },
  });

  if (result.count === 0) {
    return { ok: false, error: "Expert profile not found." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/experts");
  return { ok: true };
}
