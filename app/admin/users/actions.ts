"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { applyPlanChange, type Plan } from "@/lib/subscription";
import { sendPasswordResetEmail } from "@/lib/mailer";
import {
  buildResetPasswordUrl,
  generateResetToken,
  getResetTokenExpiry,
  hashResetToken,
} from "@/lib/password-reset";

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

  const result = await applyPlanChange({
    userId,
    plan,
    changedBy: "admin",
    changedById: session.user.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/subscriptions");
  return { ok: true };
}

export type ManualPasswordResetResult = {
  ok: boolean;
  error?: string;
  /**
   * The absolute reset link. It is a bearer credential — whoever holds it can
   * set the password — so it is returned to the admin and never logged.
   */
  resetUrl?: string;
  /** The address the link was issued for. */
  email?: string;
  /** ISO timestamp after which the link stops working. */
  expiresAt?: string;
};

/**
 * Issues a password reset on a user's behalf, for an admin helping someone
 * who cannot reach their inbox.
 *
 * The link is emailed to the user and also returned here so the admin can
 * hand it over directly when that is more practical — by chat, say. The
 * rules match the self-service flow exactly: only the digest of the token is
 * stored, and only the newest link stays redeemable.
 */
export async function generateAdminResetLink(
  target: { userId?: string | null; email?: string | null },
): Promise<ManualPasswordResetResult> {
  return sendManualPasswordReset(target);
}

export async function sendManualPasswordReset(
  target: { userId?: string | null; email?: string | null },
): Promise<ManualPasswordResetResult> {
  const session = await getAdminSession();

  if (!session || session.user?.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized." };
  }

  const userId =
    typeof target?.userId === "string" ? target.userId.trim() : "";
  const rawEmail =
    typeof target?.email === "string" ? target.email.trim().toLowerCase() : "";

  if (!userId && !rawEmail) {
    return { ok: false, error: "Missing user id or email." };
  }

  // The target is resolved here rather than trusted from the caller, so a
  // request cannot point the reset at an account other than the one named.
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      })
    : await prisma.user.findUnique({
        where: { email: rawEmail },
        select: { id: true, email: true },
      });

  if (!user) {
    return { ok: false, error: "User not found." };
  }

  // Issuing a new link retires the previous ones, exactly as the
  // forgot-password flow does: only the most recent link can be redeemed.
  await prisma.passwordResetToken.deleteMany({
    where: { email: user.email },
  });

  const token = generateResetToken();
  const expires = getResetTokenExpiry();

  // The link is absolute: a relative path in an email resolves against the
  // mail client and never reaches the site.
  const resetUrl = buildResetPasswordUrl(token);

  await prisma.passwordResetToken.create({
    data: {
      email: user.email,
      // Only the digest is stored, so the database row cannot be turned back
      // into a working reset link.
      token: hashResetToken(token),
      expires,
    },
  });

  try {
    await sendPasswordResetEmail({ to: user.email, resetUrl });
  } catch (error) {
    console.error("[password-reset] admin-triggered email failed:", error);

    // The link was never delivered, so it should not stay usable.
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    });

    return {
      ok: false,
      error:
        "The reset email could not be sent. Check the mail settings and try again.",
    };
  }

  // Who asked and for whom is logged for the audit trail. The link itself is
  // not: it would be a usable credential in the logs.
  console.info(
    `[password-reset] admin ${session.user.id} issued a reset link for user ${user.id}`,
  );

  return {
    ok: true,
    resetUrl,
    email: user.email,
    expiresAt: expires.toISOString(),
  };
}
