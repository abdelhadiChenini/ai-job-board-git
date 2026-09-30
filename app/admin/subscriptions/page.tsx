import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";
import SubscriptionTable, { type SubscriptionRow } from "./SubscriptionTable";

export const metadata: Metadata = {
  title: "Subscriptions",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/**
 * Prisma filters on the related expert profile so admins can search by the name
 * they see on the site, not just the address the account was created with.
 */
function buildWhere(query: string, plan: string) {
  const where: Record<string, unknown> = {};

  if (query) {
    where.OR = [
      { email: { contains: query } },
      { expertProfile: { is: { fullName: { contains: query } } } },
    ];
  }

  if (plan === "FREE" || plan === "PRO") {
    where.plan = plan;
  }

  return where;
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;
  const query = first(params.q).slice(0, 100);
  const planFilter = first(params.plan);
  const page = Math.max(Number(first(params.page) ?? "1") || 1, 1);

  const where = buildWhere(query, planFilter);

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ plan: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        paypalSubscriptionId: true,
        createdAt: true,
        expertProfile: { select: { fullName: true } },
        // Newest first, so the panel shows when the current plan was set.
        planChangeLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            oldPlan: true,
            newPlan: true,
            changedBy: true,
            changedById: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  const rows: SubscriptionRow[] = users.map((user) => {
    const lastChange = user.planChangeLogs[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      fullName: user.expertProfile?.fullName ?? null,
      role: user.role,
      plan: normalizePlan(user.plan),
      paypalSubscriptionId: user.paypalSubscriptionId,
      joinedAt: user.createdAt.toISOString(),
      lastChange: lastChange
        ? {
            oldPlan: normalizePlan(lastChange.oldPlan),
            newPlan: normalizePlan(lastChange.newPlan),
            changedBy: lastChange.changedBy,
            at: lastChange.createdAt.toISOString(),
          }
        : null,
    };
  });

  const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const summary = {
    total,
    pro: await prisma.user.count({ where: { plan: "PRO" } }),
    free: await prisma.user.count({ where: { plan: "FREE" } }),
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Subscriptions
        </h1>
        <p className="text-sm text-slate-400">
          {summary.pro} Pro · {summary.free} Free ·{" "}
          {summary.total} account{summary.total === 1 ? "" : "s"} in total.
          Plan changes are written to the audit log with your admin id.
        </p>
      </header>

      <SubscriptionTable
        rows={rows}
        query={query}
        planFilter={planFilter}
        page={page}
        pageCount={pageCount}
        total={total}
      />
    </div>
  );
}
