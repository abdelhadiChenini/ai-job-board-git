import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { saveSmtpSettings } from "./actions";

export const metadata: Metadata = {
  title: "SMTP Settings",
};

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none";

const cardClass = "rounded-card border border-white/10 bg-slate-800 p-6 sm:p-8";

export default async function AdminSmtpSettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  await requireAdmin();

  const settings = await prisma.sMTPSettings.findUnique({
    where: { id: "default" },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          SMTP Settings
        </h1>
        <p className="text-sm text-slate-400">
          Configure the mail server used for sending replies from the inbox.
        </p>
      </header>

      {searchParams.saved && (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
        >
          SMTP settings saved.
        </p>
      )}

      {searchParams.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          Could not save. Check that all fields are valid and try again.
        </p>
      )}

      <section className={cardClass}>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Mail server
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Credentials are stored encrypted-at-rest via the database and used by
          the replying utility.
        </p>

        <form action={saveSmtpSettings} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Host
              <input
                type="text"
                name="host"
                required
                defaultValue={settings?.host ?? ""}
                placeholder="smtp.example.com"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Port
              <input
                type="number"
                name="port"
                required
                min={1}
                max={65535}
                defaultValue={settings?.port ?? 587}
                placeholder="587"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Username
              <input
                type="text"
                name="user"
                required
                autoComplete="username"
                defaultValue={settings?.user ?? ""}
                placeholder="you@example.com"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Password
              <input
                type="password"
                name="pass"
                autoComplete="new-password"
                placeholder={settings?.pass ? "•••••••• (stored)" : "••••••••"}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              From email
              <input
                type="email"
                name="fromEmail"
                required
                defaultValue={settings?.fromEmail ?? ""}
                placeholder="hello@example.com"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              From name
              <input
                type="text"
                name="fromName"
                required
                defaultValue={settings?.fromName ?? ""}
                placeholder="AI Job Board"
                className={inputClass}
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700"
          >
            Save SMTP settings
          </button>
        </form>
      </section>
    </div>
  );
}