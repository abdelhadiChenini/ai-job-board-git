import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";
import AdminSidebar from "./AdminSidebar";
import NotificationBell from "@/components/admin/NotificationBell";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6 py-8 lg:flex-row lg:gap-8">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-end">
          <NotificationBell />
        </div>
        {children}
      </div>
    </div>
  );
}
