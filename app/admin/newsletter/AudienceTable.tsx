"use client";

import { cardClass } from "../ui";

export type AudienceRow = {
  email: string;
  source: "Account" | "Newsletter";
  date: Date;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toCsvDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function exportCsv(rows: AudienceRow[]) {
  const headers = "Email,Source,Date";
  const lines = rows.map(
    (row) => `${row.email},${row.source},${toCsvDate(row.date)}`,
  );
  const csvContent = [headers, ...lines].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "audience_export.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function AudienceTable({ rows }: { rows: AudienceRow[] }) {
  const accountCount = rows.filter((row) => row.source === "Account").length;
  const newsletterCount = rows.length - accountCount;

  return (
    <section className={cardClass}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {rows.length} contact{rows.length === 1 ? "" : "s"}
          <span className="mx-2 text-slate-600">•</span>
          {accountCount} account{accountCount === 1 ? "" : "s"}
          <span className="mx-2 text-slate-600">•</span>
          {newsletterCount} newsletter
        </p>
        <button
          type="button"
          onClick={() => exportCsv(rows)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500"
        >
          Export CSV
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No audience yet. Subscribers and registered users will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Email Address</th>
                <th className="pb-3 pr-4 font-semibold">Source</th>
                <th className="pb-3 font-semibold">Date Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.email} className="border-t border-slate-700/60">
                  <td className="py-3 pr-4 text-white">{row.email}</td>
                  <td className="py-3 pr-4">
                    {row.source === "Account" ? (
                      <span className="inline-flex rounded-full border border-blue-800 bg-blue-950/30 px-2.5 py-1 text-xs font-medium text-blue-400">
                        Account
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-emerald-800 bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-400">
                        Newsletter
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-slate-300">
                    {formatDate(row.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AudienceTable;