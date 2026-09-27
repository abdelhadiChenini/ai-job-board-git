"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseFaqItemsField, serializeFaqItems } from "@/lib/faq";

const SITE_TITLE_KEY = "site_title";
const SITE_HEADER_KEY = "site_header";
const FAQ_SLUG = "faq";

export async function saveSiteSettings(formData: FormData) {
  await requireAdmin();

  const siteTitle = String(formData.get("siteTitle") ?? "").trim();
  const siteHeader = String(formData.get("siteHeader") ?? "").trim();

  if (!siteTitle || siteTitle.length > 120 || siteHeader.length > 160) {
    redirect("/admin/settings?error=settings");
  }

  await prisma.siteSetting.upsert({
    where: { key: SITE_TITLE_KEY },
    update: { value: siteTitle },
    create: { key: SITE_TITLE_KEY, value: siteTitle },
  });

  await prisma.siteSetting.upsert({
    where: { key: SITE_HEADER_KEY },
    update: { value: siteHeader },
    create: { key: SITE_HEADER_KEY, value: siteHeader },
  });

  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=settings");
}

export async function saveFaqPage(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("faqTitle") ?? "").trim();
  const items = parseFaqItemsField(String(formData.get("faqItems") ?? ""));

  if (!title || title.length > 120 || items === null) {
    redirect("/admin/settings?error=faq");
  }

  const content = serializeFaqItems(items);

  if (content.length > 60000) {
    redirect("/admin/settings?error=faq");
  }

  await prisma.page.upsert({
    where: { slug: FAQ_SLUG },
    update: { title, content },
    create: { slug: FAQ_SLUG, title, content },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/faq");
  redirect("/admin/settings?saved=faq");
}

export async function toggleMaintenance(status: boolean) {
  await requireAdmin();

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: { isMaintenanceMode: status },
    create: { id: 1, isMaintenanceMode: status },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
