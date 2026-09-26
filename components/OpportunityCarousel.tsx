"use client";

import { useEffect, useRef, useState } from "react";
import JobCard from "@/app/components/JobCard";

export type OpportunityCarouselItem = {
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

type OpportunityCarouselProps = {
  title: string;
  opportunities: OpportunityCarouselItem[];
  savedOpportunityIds?: string[];
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

export function OpportunityCarousel({
  title,
  opportunities,
  savedOpportunityIds = [],
}: OpportunityCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const pauseTimeoutRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const savedIds = new Set(savedOpportunityIds);

  const scroll = (offset: number) => {
    setIsPaused(true);
    carouselRef.current?.scrollBy({ left: offset, behavior: "smooth" });

    if (pauseTimeoutRef.current !== null) {
      window.clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false);
      pauseTimeoutRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      const carousel = carouselRef.current;
      if (!carousel || isHovered || isPaused) {
        return;
      }

      if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth) {
        carousel.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      carousel.scrollBy({ left: 350, behavior: "smooth" });
    }, 3500);

    return () => window.clearInterval(interval);
  }, [isHovered, isPaused]);

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current !== null) {
        window.clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="w-full -mx-6 overflow-hidden py-20 pl-6 md:-mx-12 md:pl-12 lg:-mx-20 xl:pl-[max(3rem,calc((100vw_-_1400px)/2_+_3rem))]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mb-6 flex items-end justify-between gap-4 pr-6 md:pr-12 xl:pr-[max(3rem,calc((100vw_-_1400px)/2_+_3rem))]">
        <div className="flex items-center gap-3">
          <h2 className="bg-gradient-to-r from-white to-accent bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {title}
          </h2>
          <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm font-semibold text-slate-300">
            {opportunities.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll(-400)}
            aria-label={`Scroll ${title.toLowerCase()} left`}
            className="rounded-full bg-slate-800 p-2 text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => scroll(400)}
            aria-label={`Scroll ${title.toLowerCase()} right`}
            className="rounded-full bg-slate-800 p-2 text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>

      <p className="mb-6 pr-6 text-slate-400 md:pr-12 xl:pr-[max(3rem,calc((100vw_-_1400px)/2_+_3rem))]">
        Hand-picked roles from the world&apos;s leading AI labs and platforms.
      </p>

      {opportunities.length === 0 ? (
        <div className="pr-6 md:pr-12 xl:pr-[max(3rem,calc((100vw_-_1400px)/2_+_3rem))]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              No open roles right now
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              New AI positions are posted regularly — check back soon.
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={carouselRef}
          className="hide-scrollbar flex w-full gap-6 overflow-x-auto pb-4 pr-6 md:pr-12"
        >
          {opportunities.map((opportunity) => (
            <div key={opportunity.id} className="w-80 shrink-0">
              <JobCard
                title={opportunity.title}
                labName={opportunity.platform?.name ?? opportunity.aiLabName}
                tags={toTagList(opportunity.tags)}
                logoUrl={opportunity.platform?.logoUrl}
                badge={opportunity.badge}
                slug={opportunity.slug}
                url={`/api/redirect?id=${opportunity.id}`}
                jobId={opportunity.id}
                saved={savedIds.has(opportunity.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OpportunityCarousel;
