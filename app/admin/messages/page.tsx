import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { MessagesTable } from "./MessagesTable";

export const metadata: Metadata = {
  title: "Inbox",
};

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Inbox</h1>
        <p className="text-sm text-slate-400">
          Message submissions from the contact form.
        </p>
      </header>

      <MessagesTable />
    </div>
  );
}