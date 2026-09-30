"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserPlan } from "@/app/admin/users/actions";
import { cardClass, inputClass, primaryBtn, subtleBtn } from "../ui";
import type { Plan } from "@/lib/subscription";

export type SubscriptionRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  plan: Plan;
  paypalSubscriptionId: string | null;
  joinedAt: string;
  lastChange: {
    oldPlan: Plan;
    newPlan: Plan;
    changedBy: string;
    at: string;
  } | null;
};

type Props = {
  rows: SubscriptionRow[];
  query: string;
  planFilter: string;
  page: number;
  pageCount: number;
  total: number;
};

const SOURCE_LABEL: Record<string, string> = {
  admin: "Administrator",
  webhook: "PayPal",
  reconcile: "Reconciliation",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SubscriptionTable({
  rows,
  query,
  planFilter,
  page,
  pageCount,
  total,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(query);
  const [busyId, setBusyId] = useState<string | null>(null);

  const applyFilters = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (planFilter && planFilter !== "ALL") params.set("plan", planFilter);
      startTransition(() => {
        router.push(`/admin/subscriptions?${params.toString()}`);
      });
    },
    [search, planFilter, router],
  );

  const changePlan = useCallback(
    (row: SubscriptionRow, plan: Plan) => {
      if (plan === row.plan) return;

      const verb = plan === "PRO" ? "Assign Pro to" : "Downgrade";

      setBusyId(row.id);
      setError(null);

      if (!window.confirm(`${verb} ${row.email}?`)) {
        setBusyId(null);
        // Snap the controlled select back to the plan actually on file.
        router.refresh();
        return;
      }

      startTransition(async () => {
        const result = await setUserPlan(row.id, plan);
        if (result && !result.ok) {
          setError(result.error ?? `Could not update ${row.email}.`);
        }
        setBusyId(null);
        // Re-reads the server rows, including the new audit entry.
        router.refresh();
      });
    },
    [router],
  );

  return (
    <section className={cardClass}>
      <form onSubmit={applyFilters} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Search by email or name</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by email or name…"
            className={inputClass}
          />
        </label>

        <label>
          <span className="sr-only">Filter by plan</span>
          <select
            value={planFilter || "ALL"}
            onChange={(event) => {
              const value = event.target.value;
              const params = new URLSearchParams();
              if (search.trim()) params.set("q", search.trim());
              if (value !== "ALL") params.set("plan", value);
              startTransition(() => {
                router.push(`/admin/subscriptions?${params.toString()}`);
              });
            }}
            className={inputClass}
          >
            <option value="ALL">All plans</option>
            <option value="PRO">Pro only</option>
            <option value="FREE">Free only</option>
          </select>
        </label>

        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No accounts match this search.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Account</th>
                <th className="pb-3 pr-4 font-semibold">Plan</th>
                <th className="pb-3 pr-4 font-semibold">PayPal subscription</th>
                <th className="pb-3 pr-4 font-semibold">Last change</th>
                <th className="pb-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-700/60">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-white">
                      {row.fullName ?? "—"}
                    </p>
                    <p className="text-xs text-slate-400">{row.email}</p>
                    <p className="text-[11px] uppercase text-slate-600">
                      {row.role}
                    </p>
                  </td>

                  <td className="py-3 pr-4">
                    <select
                      aria-label={`Plan for ${row.email}`}
                      value={row.plan}
                      disabled={pending || busyId === row.id}
                      onChange={(event) =>
                        changePlan(row, event.target.value as Plan)
                      }
                      className={
                        row.plan === "PRO"
                          ? "rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300 focus:outline-none disabled:opacity-60"
                          : "rounded-full border border-slate-700 bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-400 focus:outline-none disabled:opacity-60"
                      }
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                    </select>
                  </td>

                  <td className="py-3 pr-4">
                    {row.paypalSubscriptionId ? (
                      <span
                        title={row.paypalSubscriptionId}
                        className="block max-w-[14rem] truncate font-mono text-[11px] text-slate-400"
                      >
                        {row.paypalSubscriptionId}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">
                        No active subscription
                      </span>
                    )}
                  </td>

                  <td className="py-3 pr-4 text-xs text-slate-400">
                    {row.lastChange ? (
                      <>
                        <p className="text-slate-300">
                          {row.lastChange.oldPlan} →{" "}
                          <span className="font-semibold text-white">
                            {row.lastChange.newPlan}
                          </span>
                        </p>
                        <p className="text-slate-500">
                          {SOURCE_LABEL[row.lastChange.changedBy] ??
                            row.lastChange.changedBy}{" "}
                          · {formatDate(row.lastChange.at)}
                        </p>
                      </>
                    ) : (
                      <span className="text-slate-600">No changes recorded</span>
                    )}
                  </td>

                  <td className="py-3 text-right">
                    <button
                      type="button"
                      disabled={pending || busyId === row.id}
                      onClick={() =>
                        changePlan(row, row.plan === "PRO" ? "FREE" : "PRO")
                      }
                      className="text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-60"
                    >
                      {row.plan === "PRO" ? "Downgrade" : "Assign Pro"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/60 pt-4 text-sm text-slate-400">
        <span>
          Showing {rows.length} of {total}
        </span>

        {pageCount > 1 && (
          <div className="flex items-center gap-3">
            <PaginationLink
              label="Previous"
              disabled={page <= 1 || pending}
              href={`/admin/subscriptions?${buildParams({
                q: query,
                plan: planFilter,
                page: String(page - 1),
              })}`}
            />
            <span className="text-xs text-slate-500">
              Page {page} of {pageCount}
            </span>
            <PaginationLink
              label="Next"
              disabled={page >= pageCount || pending}
              href={`/admin/subscriptions?${buildParams({
                q: query,
                plan: planFilter,
                page: String(page + 1),
              })}`}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function buildParams(values: {
  q: string;
  plan: string;
  page: string;
}): string {
  const params = new URLSearchParams();
  if (values.q) params.set("q", values.q);
  if (values.plan && values.plan !== "ALL") params.set("plan", values.plan);
  params.set("page", values.page);
  return params.toString();
}

function PaginationLink({
  label,
  href,
  disabled,
}: {
  label: string;
  href: string;
  disabled: boolean;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => router.push(`/admin/subscriptions?${href}`)}
      className={subtleBtn}
    >
      {label}
    </button>
  );
}

export default SubscriptionTable;
