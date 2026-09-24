"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const SMTP_ID = "default";

export async function saveSmtpSettings(formData: FormData) {
  await requireAdmin();

  const host = String(formData.get("host") ?? "").trim();
  const port = Number(formData.get("port") ?? 0);
  const user = String(formData.get("user") ?? "").trim();
  const pass = String(formData.get("pass") ?? "");
  const fromEmail = String(formData.get("fromEmail") ?? "").trim();
  const fromName = String(formData.get("fromName") ?? "").trim();

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !user ||
    !fromEmail ||
    !fromEmail.includes("@") ||
    !fromName
  ) {
    redirect("/admin/settings/smtp?error=validation");
  }

  const existing = await prisma.sMTPSettings.findUnique({
    where: { id: SMTP_ID },
  });

  await prisma.sMTPSettings.upsert({
    where: { id: SMTP_ID },
    update: {
      host,
      port,
      user,
      pass: pass || existing?.pass || "",
      fromEmail,
      fromName,
    },
    create: {
      id: SMTP_ID,
      host,
      port,
      user,
      pass,
      fromEmail,
      fromName,
    },
  });

  revalidatePath("/admin/settings/smtp");
  redirect("/admin/settings/smtp?saved=1");
}