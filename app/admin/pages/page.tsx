import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { PagesTable } from "./PagesTable";

export const metadata: Metadata = {
  title: "Manage Pages",
};

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Pages</h1>
        <p className="text-sm text-slate-400">
          Static pages for the CMS — privacy policy, terms and more.
        </p>
      </header>

      <PagesTable />
    </div>
  );
}