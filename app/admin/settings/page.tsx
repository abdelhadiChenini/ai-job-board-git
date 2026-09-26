import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { saveFaqPage, saveSiteSettings, toggleMaintenance } from "./actions";

export const metadata: Metadata = {
  title: "Site Settings",
};

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none";

const cardClass =
  "rounded-card border border-white/10 bg-slate-800 p-6 sm:p-8";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  await requireAdmin();

  const [siteTitleSetting, siteHeaderSetting, faqPage, globalSettings] =
    await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: "site_title" } }),
      prisma.siteSetting.findUnique({ where: { key: "site_header" } }),
      prisma.page.findUnique({ where: { slug: "faq" } }),
      prisma.siteSettings.findUnique({ where: { id: 1 } }),
    ]);

  const isMaintenanceMode = globalSettings?.isMaintenanceMode ?? false;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Site Settings
        </h1>
        <p className="text-sm text-slate-400">
          Manage the website title, global header and FAQ page content stored
          in the database.
        </p>
      </header>

      {searchParams.saved && (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
        >
          {searchParams.saved === "faq"
            ? "FAQ page content saved."
            : "Site settings saved."}
        </p>
      )}

      {searchParams.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          Could not save your changes. Check the field lengths and try again.
        </p>
      )}

      <section className={cardClass}>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Website settings
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Stored as <code className="text-slate-300">SiteSetting</code>{" "}
          records: <code className="text-slate-300">site_title</code> and{" "}
          <code className="text-slate-300">site_header</code>.
        </p>

        <form action={saveSiteSettings} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Website title
            <input
              type="text"
              name="siteTitle"
              required
              maxLength={120}
              defaultValue={siteTitleSetting?.value ?? ""}
              placeholder="AI Job Board"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Global header
            <input
              type="text"
              name="siteHeader"
              maxLength={160}
              defaultValue={siteHeaderSetting?.value ?? ""}
              placeholder="Find work shaping the future of AI."
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700"
          >
            Save settings
          </button>
        </form>
      </section>

      <section className={cardClass}>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Maintenance mode
          </h2>
          <p className="text-sm text-slate-400">
            When enabled, every visitor sees the &ldquo;Under
            Maintenance&rdquo; screen. Admins keep full access to the site.
          </p>
        </div>

        <form
          action={toggleMaintenance.bind(null, !isMaintenanceMode)}
          className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-900/40 p-4"
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-white">
              {isMaintenanceMode ? "Maintenance is on" : "Site is live"}
            </p>
            <p className="text-xs text-slate-400">
              Stored in the{" "}
              <code className="text-slate-300">SiteSettings</code> record with
              id <code className="text-slate-300">1</code>.
            </p>
          </div>

          <button
            type="submit"
            role="switch"
            aria-checked={isMaintenanceMode}
            aria-label="Toggle maintenance mode"
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              isMaintenanceMode
                ? "border-red-500 bg-red-600"
                : "border-slate-600 bg-slate-700"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 rounded-full bg-white transition-transform ${
                isMaintenanceMode ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </form>
      </section>

      <section id="faq-page" className={`${cardClass} scroll-mt-24`}>
        <h2 className="text-xl font-bold tracking-tight text-white">
          FAQ page
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Edit the raw text content of the{" "}
          <code className="text-slate-300">Page</code> record with slug{" "}
          <code className="text-slate-300">faq</code>.
        </p>

        <form action={saveFaqPage} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            FAQ title
            <input
              type="text"
              name="faqTitle"
              required
              maxLength={120}
              defaultValue={faqPage?.title ?? "Frequently Asked Questions"}
              placeholder="Frequently Asked Questions"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Raw page content
            <textarea
              name="faqContent"
              rows={14}
              defaultValue={faqPage?.content ?? ""}
              placeholder={"What is this platform?\nHow do I apply for roles?"}
              className={`${inputClass} font-mono`}
            />
          </label>

          <button
            type="submit"
            className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700"
          >
            Save FAQ page
          </button>
        </form>
      </section>
    </div>
  );
}
