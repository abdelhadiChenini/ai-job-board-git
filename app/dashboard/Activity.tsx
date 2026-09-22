"use client";

import Link from "next/link";
import { useState } from "react";

type ActivityJob = {
  id: string;
  slug: string | null;
  title: string;
  aiLabName: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  tags: unknown;
  affiliateUrl: string;
  platform: { name: string; logoUrl: string | null };
};

function formatRate(job: {
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
}): string {
  const currency = job.currency || "USD";
  if (job.salaryMin !== null && job.salaryMax !== null) {
    return `$${job.salaryMin} – $${job.salaryMax} ${currency}`;
  }
  if (job.salaryMin !== null) {
    return `From $${job.salaryMin} ${currency}`;
  }
  if (job.salaryMax !== null) {
    return `Up to $${job.salaryMax} ${currency}`;
  }
  return "Rate on request";
}

function companyInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

type Tab = "saved" | "applied";

export function Activity({
  jobs,
  savedJobIds,
  appliedJobIds,
}: {
  jobs: ActivityJob[];
  savedJobIds: string[];
  appliedJobIds: string[];
}) {
  const [tab, setTab] = useState<Tab>("saved");

  const savedJobs = jobs.filter((job) => savedJobIds.includes(job.id));
  const appliedJobs = jobs.filter((job) => appliedJobIds.includes(job.id));
  const isApplied = (id: string) => appliedJobIds.includes(id);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "saved", label: "Saved", count: savedJobs.length },
    { key: "applied", label: "Applied", count: appliedJobs.length },
  ];

  const activeJobs = tab === "saved" ? savedJobs : appliedJobs;

  const renderJob = (job: ActivityJob) => {
    const applied = isApplied(job.id);
    const primaryTag = Array.isArray(job.tags) && typeof job.tags[0] === "string"
      ? job.tags[0]
      : null;

    return (
      <li
        key={job.id}
        className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4"
      >
        <div className="flex items-center gap-3">
          {job.platform.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={job.platform.logoUrl}
              alt={`${job.platform.name} logo`}
              className="h-8 w-8 rounded-lg border border-white/10 bg-slate-950 object-contain p-0.5"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/15 text-xs font-bold text-blue-400">
              {companyInitials(job.platform.name)}
            </span>
          )}
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {job.aiLabName}
          </p>
        </div>

        <h3 className="text-sm font-bold leading-snug text-white">
          {job.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            {formatRate(job)}
          </span>
          {applied && (
            <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-400">
              Applied
            </span>
          )}
          {primaryTag && (
            <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-400">
              {primaryTag}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between gap-3">
          {job.slug ? (
            <Link
              href={`/opportunities/${job.slug}`}
              className="text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300"
            >
              View details
            </Link>
          ) : (
            <span className="text-sm text-slate-500">No details page</span>
          )}
          <a
            href={job.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            {applied ? "Apply again" : "Apply"}
          </a>
        </div>
      </li>
    );
  };

  return (
    <section className="rounded-card border border-white/10 bg-slate-800 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold tracking-tight text-white">
          Activity
        </h2>
        <div className="flex gap-2">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => setTab(tabItem.key)}
              aria-pressed={tab === tabItem.key}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === tabItem.key
                  ? "bg-blue-600 text-white"
                  : "border border-white/10 text-slate-300 hover:border-blue-500/50 hover:text-white"
              }`}
            >
              {tabItem.label} ({tabItem.count})
            </button>
          ))}
        </div>
      </div>

      {activeJobs.length > 0 ? (
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {activeJobs.map(renderJob)}
        </ul>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-white/15 bg-slate-900/40 p-6 text-center">
          <p className="text-sm text-slate-400">
            {tab === "saved"
              ? "You haven&rsquo;t saved any roles yet. Bookmark opportunities to track them here."
              : "You haven&rsquo;t applied to any roles yet. Submitted applications will appear here."}
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Browse opportunities
          </Link>
        </div>
      )}
    </section>
  );
}

export default Activity;