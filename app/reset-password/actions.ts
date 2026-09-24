"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!token) {
    return { ok: false, error: "This reset link is invalid or expired." };
  }

  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { ok: false, error: "This reset link is invalid or expired." };
  }

  if (resetToken.expires.getTime() < Date.now()) {
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

  await prisma.passwordResetToken.delete({
    where: { token: resetToken.token },
  });

  redirect("/login?success=password-reset");
}