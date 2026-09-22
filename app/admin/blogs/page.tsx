import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { BlogTable } from "./BlogTable";

export const metadata: Metadata = {
  title: "Manage Blog Posts",
};

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Blog Posts
        </h1>
        <p className="text-sm text-slate-400">
          Draft, schedule and publish SEO-optimised blog posts.
        </p>
      </header>

      <BlogTable />
    </div>
  );
}