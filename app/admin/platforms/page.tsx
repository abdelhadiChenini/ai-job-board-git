import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { PlatformTable } from "./PlatformTable";

export const metadata: Metadata = {
  title: "Manage Platforms",
};

export const dynamic = "force-dynamic";

export default async function AdminPlatformsPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Platforms
        </h1>
        <p className="text-sm text-slate-400">
          Manage the AI platforms that host opportunities.
        </p>
      </header>

      <PlatformTable />
    </div>
  );
}