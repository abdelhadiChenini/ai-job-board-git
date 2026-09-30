"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import type { Plan } from "@/lib/subscription";

const PLANS: readonly Plan[] = ["FREE", "PRO"];

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

export async function setFeatured(
  userId: string,
  isFeatured: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getAdminSession();

  if (!session || session.user?.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized." };
  }

  if (!userId) {
    return { ok: false, error: "Missing user id." };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { isFeatured } });
  } catch {
    return { ok: false, error: "User not found." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/experts");
  return { ok: true };
}

/**
 * Support escape hatch for when a PayPal webhook fails to upgrade an account.
 * Deliberately strict — `normalizePlan` would silently coerce a typo to FREE.
 */
export async function setUserPlan(
  userId: string,
  plan: Plan,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getAdminSession();

  if (!session || session.user?.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized." };
  }

  if (!userId) {
    return { ok: false, error: "Missing user id." };
  }

  if (!PLANS.includes(plan)) {
    return { ok: false, error: "Invalid plan." };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { plan } });
  } catch {
    return { ok: false, error: "User not found." };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}
