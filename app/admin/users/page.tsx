import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { UserTable } from "./UserTable";

export const metadata: Metadata = {
  title: "Manage Users",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Users</h1>
        <p className="text-sm text-slate-400">
          Manage admin and expert accounts.
        </p>
      </header>

      <UserTable />
    </div>
  );
}