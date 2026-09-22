import type { Metadata } from "next";
import PlatformCard from "@/app/components/PlatformCard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "AI Platforms",
};

export const revalidate = 60;

function toTagList(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.filter((tag): tag is string => typeof tag === "string");
}

function collectTags(offers: { tags: unknown }[]): string[] {
  const tags: string[] = [];
  for (const offer of offers) {
    for (const tag of toTagList(offer.tags)) {
      if (!tags.includes(tag) && tags.length < 4) {
        tags.push(tag);
      }
    }
  }
  return tags;
}

export default async function PlatformsPage() {
  const platforms = await prisma.aIPlatform.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      websiteUrl: true,
      description: true,
      jobOffers: { select: { tags: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <section className="bg-navy">
        <div className="flex flex-col items-center gap-6 pt-4 text-center sm:pt-6">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Discover platforms built around AI work.
          </h1>
          <p className="max-w-xl text-slate-400">
            Browse the lab and vendor partners hiring across model evaluations,
            data annotation and AI quality work.
          </p>
          <div className="relative w-full max-w-2xl">
            <svg
              className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="search"
              placeholder="Search AI platforms and services..."
              aria-label="Search AI platforms"
              className="w-full rounded-full border border-white/20 bg-white/10 py-4 pl-12 pr-5 text-sm text-white placeholder:text-slate-400 backdrop-blur-sm focus:outline-2 focus:outline-blue-400"
            />
          </div>
        </div>
      </section>

      <section className="-mx-4 my-8 bg-paper px-4 py-16 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Partner platforms
          </h2>
          <p className="max-w-2xl text-slate-600">
            Explore the platforms hiring for AI-focused work and see what
            opportunities they currently list.
          </p>
        </div>

        {platforms.length === 0 ? (
          <div className="mt-10 rounded-card border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              No platforms listed yet
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              New AI platforms will appear here soon.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform) => (
              <PlatformCard
                key={platform.id}
                name={platform.name}
                description={platform.description}
                tags={collectTags(platform.jobOffers)}
                websiteUrl={platform.websiteUrl}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}