import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AudienceTable } from "./AudienceTable";
import type { AudienceRow } from "./AudienceTable";

export const metadata: Metadata = {
  title: "Email Marketing",
};

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  await requireAdmin();

  const [users, subscribers] = await Promise.all([
    prisma.user.findMany({ select: { email: true, createdAt: true } }),
    prisma.subscriber.findMany({ select: { email: true, createdAt: true } }),
  ]);

  const combined: AudienceRow[] = [
    ...users.map((user) => ({
      email: user.email,
      source: "Account" as const,
      date: user.createdAt,
    })),
    ...subscribers.map((subscriber) => ({
      email: subscriber.email,
      source: "Newsletter" as const,
      date: subscriber.createdAt,
    })),
  ];

  const byEmail = new Map<string, AudienceRow>();
  for (const row of combined) {
    const existing = byEmail.get(row.email);
    if (!existing) {
      byEmail.set(row.email, row);
      continue;
    }
    if (existing.source === "Newsletter" && row.source === "Account") {
      byEmail.set(row.email, {
        ...row,
        date: existing.date < row.date ? existing.date : row.date,
      });
    }
  }

  const rows = [...byEmail.values()].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Email Marketing
        </h1>
        <p className="text-sm text-slate-400">
          Registered accounts and newsletter subscribers, merged into one
          audience list.
        </p>
      </header>

      <AudienceTable rows={rows} />
    </div>
  );
}