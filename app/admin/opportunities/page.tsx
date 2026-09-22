import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { OpportunityTable } from "./OpportunityTable";

export const metadata: Metadata = {
  title: "Manage Opportunities",
};

export const dynamic = "force-dynamic";

export default async function AdminOpportunitiesPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Opportunities
        </h1>
        <p className="text-sm text-slate-400">
          Manage job offers published across AI platforms.
        </p>
      </header>

      <OpportunityTable />
    </div>
  );
}