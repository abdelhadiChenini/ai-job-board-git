import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { OpportunityTable } from "./OpportunityTable";

export const metadata: Metadata = {
  title: "Manage Opportunities",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

const listArgs = {
  include: { platform: { select: { id: true, name: true, slug: true } } },
  orderBy: { createdAt: "desc" },
} satisfies Prisma.JobOfferFindManyArgs;

export default async function AdminOpportunitiesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  await requireAdmin();

  const currentPage = Math.max(1, Number(searchParams.page) || 1);
  const take = PAGE_SIZE;
  const skip = (currentPage - 1) * take;

  const [categories, totalCount, firstSlice] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.jobOffer.count(),
    prisma.jobOffer.findMany({ ...listArgs, take, skip }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / take));
  const page = Math.min(currentPage, totalPages);
  const rows =
    page === currentPage
      ? firstSlice
      : await prisma.jobOffer.findMany({
          ...listArgs,
          take,
          skip: (page - 1) * take,
        });

  const opportunities = rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

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

      <OpportunityTable
        categories={categories}
        opportunities={opportunities}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  );
}
