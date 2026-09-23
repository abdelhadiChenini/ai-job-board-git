"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { removeSavedJob } from "./actions";

type ActivityJob = {
  id: string;
  slug: string | null;
  title: string;
  aiLabName: string;
  affiliateUrl: string;
  platform: { name: string; logoUrl: string | null };
};

function platformInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

type Tab = "saved" | "applied";

export function Activity({
  savedJobs,
  appliedJobs,
}: {
  savedJobs: ActivityJob[];
  appliedJobs: ActivityJob[];
}) {
  const [tab, setTab] = useState<Tab>("saved");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "saved", label: "Saved", count: savedJobs.length },
    { key: "applied", label: "Applied", count: appliedJobs.length },
  ];

  const activeJobs = tab === "saved" ? savedJobs : appliedJobs;

  const handleRemove = (jobId: string) => {
    setRemovingId(jobId);
    startTransition(async () => {
      try {
        await removeSavedJob(jobId);
      } finally {
        setRemovingId(null);
      }
    });
  };

  const renderJob = (job: ActivityJob) => {
    const removing = removingId === job.id;

    return (
      <li
        key={job.id}
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3"
      >
        {job.platform.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.platform.logoUrl}
            alt={`${job.platform.name} logo`}
            className="h-8 w-8 shrink-0 rounded-lg border border-white/10 bg-slate-950 object-contain p-0.5"
          />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-xs font-bold text-blue-400">
            {platformInitials(job.platform.name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {job.title}
          </p>
          <p className="truncate text-xs text-slate-400">
            {job.platform.name}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={job.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
          >
            View posting
          </a>

          {tab === "saved" && (
            <button
              type="button"
              onClick={() => handleRemove(job.id)}
              disabled={isPending}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 transition-colors hover:border-red-500/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {removing ? "Removing…" : "Remove"}
            </button>
          )}
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
        <ul className="mt-5 flex flex-col gap-2">
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
