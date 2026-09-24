"use client";

import { useRef } from "react";
import JobCard from "@/app/components/JobCard";

export type TrendingJobOffer = {
  id: string;
  slug?: string | null;
  title: string;
  aiLabName: string;
  badge?: string | null;
  tags: unknown;
  platform?: {
    name: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
};

function toTagList(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.filter((tag): tag is string => typeof tag === "string");
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      {direction === "left" ? (
        <path
          fillRule="evenodd"
          d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      ) : (
        <path
          fillRule="evenodd"
          d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L12.44 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
}

export function TrendingCarousel({
  jobs,
  savedOpportunityIds = [],
}: {
  jobs: TrendingJobOffer[];
  savedOpportunityIds?: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const savedIds = new Set(savedOpportunityIds);

  const scroll = (offset: number) => {
    containerRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="py-20">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="bg-gradient-to-r from-white to-accent bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Trending Opportunities
          </h2>
          <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm font-semibold text-slate-300">
            {jobs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll(-400)}
            aria-label="Scroll trending opportunities left"
            className="rounded-full bg-slate-800 p-2 text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => scroll(400)}
            aria-label="Scroll trending opportunities right"
            className="rounded-full bg-slate-800 p-2 text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </header>
      <p className="mt-3 text-slate-400">
        Hand-picked roles from the world&apos;s leading AI labs and platforms.
      </p>

      {jobs.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            No open roles right now
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            New AI positions are posted regularly — check back soon.
          </p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="hide-scrollbar mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
        >
          {jobs.map((job) => (
            <div key={job.id} className="w-80 shrink-0 snap-center">
              <JobCard
                title={job.title}
                labName={job.platform?.name ?? job.aiLabName}
                tags={toTagList(job.tags)}
                logoUrl={job.platform?.logoUrl}
                badge={job.badge}
                slug={job.slug}
                url={`/api/redirect?id=${job.id}`}
                jobId={job.id}
                saved={savedIds.has(job.id)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default TrendingCarousel;