import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { NameListTable } from "../NameListTable";

export const metadata: Metadata = {
  title: "Manage Regions",
};

export const dynamic = "force-dynamic";

export default async function AdminRegionsPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Regions
        </h1>
        <p className="text-sm text-slate-400">
          Predefined regions used to populate the opportunity dropdown.
        </p>
      </header>

      <NameListTable
        endpoint="/api/admin/regions"
        singular="region"
        plural="regions"
        emptyText="No regions yet. Click “Add New” to add one."
      />
    </div>
  );
}