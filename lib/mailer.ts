import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailArgs) {
  const settings = await prisma.sMTPSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    throw new Error("SMTP settings have not been configured.");
  }

  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    auth: { user: settings.user, pass: settings.pass },
  });

  await transporter.sendMail({
    from: `"${settings.fromName}" <${settings.fromEmail}>`,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });
}

/**
 * Transactional mail — the kind a person is waiting for, like a password
 * reset link.
 *
 * Resend is the primary transport because it needs no per-host configuration
 * and the sending domain is already verified for the marketing campaigns. The
 * SMTP transport configured in the admin settings is the fallback for hosts
 * that have no verified Resend domain yet.
 *
 * Returns the transport that delivered the message so callers can log it.
 */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
}: SendEmailArgs): Promise<"resend" | "smtp"> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (apiKey && from) {
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });

    if (!error) {
      return "resend";
    }

    // A rejected send (unverified domain, quota, address on a suppression
    // list) must not silently drop the message: fall through to SMTP and
    // report both failures if that fails too.
    console.error("[mailer] Resend rejected the message:", error);

    try {
      await sendEmail({ to, subject, html, text });
      return "smtp";
    } catch (smtpError) {
      throw new Error(
        `Resend failed (${error.message}) and the SMTP fallback failed (${(smtpError as Error).message}).`,
      );
    }
  }

  await sendEmail({ to, subject, html, text });
  return "smtp";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * The password reset email.
 *
 * The link is printed twice on purpose: as a button for people who read
 * email in a rich client, and as a plain URL for everyone else. Both are the
 * same absolute URL built by `buildResetPasswordUrl`.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  const subject = "Reset your Ameelai password";
  const safeUrl = escapeHtml(resetUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:28px 32px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">Reset your password</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">We received a request to reset the password for your Ameelai account. Choose a new password using the button below.</p>
                <p style="margin:0 0 24px;">
                  <a href="${safeUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">Create a new password</a>
                </p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;">If the button does not work, copy this link into your browser:</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#2563eb;word-break:break-all;"><a href="${safeUrl}" style="color:#2563eb;">${safeUrl}</a></p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">This link expires in one hour and can only be used once. If you did not request a password reset, you can safely ignore this email — your password has not changed.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "Reset your password",
    "",
    "We received a request to reset the password for your Ameelai account. Choose a new password using the link below:",
    "",
    resetUrl,
    "",
    "This link expires in one hour and can only be used once.",
    "If you did not request a password reset, you can safely ignore this email — your password has not changed.",
  ].join("\n");

  return sendTransactionalEmail({ to, subject, html, text });
}
