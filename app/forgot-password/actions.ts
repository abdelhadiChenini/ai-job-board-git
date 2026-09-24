"use server";

import { prisma } from "@/lib/prisma";

export async function requestPasswordReset(email: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      email: normalizedEmail,
      token,
      expires,
    },
  });

  // TODO: Integrate SMTP to send email with link: /reset-password?token=${token}
  console.log(`Password reset link for ${normalizedEmail}: /reset-password?token=${token}`);

  return {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  };
}