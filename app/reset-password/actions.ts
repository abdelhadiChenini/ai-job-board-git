"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashResetToken, isResetTokenExpired } from "@/lib/password-reset";

const INVALID_LINK = "This reset link is invalid or expired.";

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!token) {
    return { ok: false, error: INVALID_LINK };
  }

  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  // The link carries the plain token; the database only holds its digest.
  const storedToken = hashResetToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: storedToken },
  });

  if (!resetToken) {
    return { ok: false, error: INVALID_LINK };
  }

  if (isResetTokenExpired(resetToken.expires)) {
    // An expired link is dead weight; drop it so the table does not grow.
    await prisma.passwordResetToken
      .delete({ where: { token: storedToken } })
      .catch(() => {});

    return { ok: false, error: "This reset link has expired." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.updateMany({
    where: { email: resetToken.email },
    data: { hashedPassword },
  });

  if (user.count === 0) {
    return { ok: false, error: "No account found for this reset link." };
  }

  // A link is single use: the password is already changed, so the token has
  // done its job.
  await prisma.passwordResetToken.delete({ where: { token: storedToken } });

  redirect("/login?success=password-reset");
}
