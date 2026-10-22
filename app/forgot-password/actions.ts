"use server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";
import {
  buildResetPasswordUrl,
  generateResetToken,
  getResetTokenExpiry,
  hashResetToken,
} from "@/lib/password-reset";

/**
 * The same wording is returned whether or not the address has an account, so
 * the form cannot be used to find out who is registered.
 */
const GENERIC_MESSAGE =
  "If an account exists for that email, a reset link is on its way.";

export async function requestPasswordReset(email: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  if (!user) {
    return { ok: true, message: GENERIC_MESSAGE };
  }

  // Issuing a new link retires the previous one, so only the most recent
  // request can be redeemed.
  await prisma.passwordResetToken.deleteMany({
    where: { email: normalizedEmail },
  });

  const token = generateResetToken();

  // The link is absolute: a relative path in an email resolves against the
  // mail client and never reaches the site.
  const resetUrl = buildResetPasswordUrl(token);

  await prisma.passwordResetToken.create({
    data: {
      email: normalizedEmail,
      // Only the digest is stored, so the database row cannot be turned back
      // into a working reset link.
      token: hashResetToken(token),
      expires: getResetTokenExpiry(),
    },
  });

  try {
    await sendPasswordResetEmail({ to: user.email, resetUrl });
  } catch (error) {
    console.error("[password-reset] failed to send reset email:", error);

    // The link was never delivered, so it should not stay usable.
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    return {
      ok: false,
      message:
        "We could not send the reset email right now. Please try again in a few minutes.",
    };
  }

  if (process.env.NODE_ENV !== "production") {
    // Local development has no inbox to check, so the link is echoed to the
    // server log where it can be opened directly.
    console.log(`[password-reset] reset link for ${normalizedEmail}: ${resetUrl}`);
  }

  return { ok: true, message: GENERIC_MESSAGE };
}
