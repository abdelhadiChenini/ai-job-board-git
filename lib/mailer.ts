import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailArgs) {
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
  });
}