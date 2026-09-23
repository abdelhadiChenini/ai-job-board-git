import type { Metadata } from "next";
import Link from "next/link";
import JobCard from "@/app/components/JobCard";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "AI Opportunities",
};

export const revalidate = 60;

type SearchParams = {
  q?: string;
  category?: string;
  region?: string;
  platform?: string;
};

function toTagList(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.filter((tag): tag is string => typeof tag === "string");
}

function buildHref(
  searchParams: SearchParams,
  key: string,
  value: string | null,
): string {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.category && key !== "category") {
    params.set("category", searchParams.category);
  }
  if (searchParams.region && key !== "region") {
    params.set("region", searchParams.region);
  }
  if (searchParams.platform && key !== "platform") {
    params.set("platform", searchParams.platform);
  }
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  const query = params.toString();
  return query ? `/opportunities?${query}` : "/opportunities";
}

const idlePill =
  "rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-accent/50 hover:text-white";
const activePill =
  "rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-slate-950";

function FilterGroup({
  label,
  options,
  active,
  searchParams,
  paramKey,
}: {
  label: string;
  options: string[];
  active: string | undefined;
  searchParams: SearchParams;
  paramKey: string;
}) {
  if (options.length === 0) {
    return null;
  }
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = active === option;
          return (
            <li key={option}>
              <Link
                href={buildHref(
                  searchParams,
                  paramKey,
                  isActive ? null : option,
                )}
                className={isActive ? activePill : idlePill}
                aria-pressed={isActive}
              >
                {option}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = searchParams.q?.trim();
  const category = searchParams.category?.trim();
  const region = searchParams.region?.trim();
  const platform = searchParams.platform?.trim();

  const where: Prisma.JobOfferWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { aiLabName: { contains: q } },
    ];
  }
  if (category) where.category = category;
  if (region) where.region = region;
  if (platform) where.platform = { name: platform };

  const [jobs, categories, regions, platforms] = await Promise.all([
    prisma.jobOffer.findMany({
      include: {
        platform: { select: { name: true, slug: true, logoUrl: true } },
      },
      where,
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.jobOffer.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    }),
    prisma.jobOffer.findMany({
      where: { region: { not: null } },
      select: { region: true },
      distinct: ["region"],
    }),
    prisma.aIPlatform.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const categoryOptions = categories
    .map((row) => row.category)
    .filter((value): value is string => Boolean(value))
    .sort();
  const regionOptions = regions
    .map((row) => row.region)
    .filter((value): value is string => Boolean(value))
    .sort();
  const platformOptions = platforms.map((row) => row.name);

  const hasFilters = Boolean(q || category || region || platform);

  return (
    <>
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(800px 420px at 50% -10%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(600px 360px at 10% 110%, rgba(16,185,129,0.1), transparent 60%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
              aria-hidden="true"
            />
            AI Opportunity Feed
          </span>
          <h1 className="max-w-3xl bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            Discover roles shaping the future of AI.
          </h1>
          <p className="max-w-2xl text-lg text-slate-400">
            Search AI labs and platforms hiring for model evaluation, data
            annotation and quality work.
          </p>

          <form
            action="/opportunities"
            method="get"
            className="relative mt-4 w-full max-w-2xl"
          >
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
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search titles, companies, keywords..."
              aria-label="Search opportunities"
              className="w-full rounded-full border border-white/15 bg-slate-900/70 py-4 pl-12 pr-32 text-sm text-white placeholder:text-slate-400 backdrop-blur-sm focus:outline-2 focus:outline-accent"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-accent/80"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 pb-20 lg:grid-cols-4">
        <aside className="min-w-0 lg:col-span-1">
          <div className="sticky top-24 flex flex-col gap-7 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Filters</h2>
              {hasFilters && (
                <Link
                  href="/opportunities"
                  className="text-xs font-semibold text-accent transition-colors hover:text-blue-200"
                >
                  Clear all
                </Link>
              )}
            </div>

            <FilterGroup
              label="Categories"
              paramKey="category"
              options={categoryOptions}
              active={category}
              searchParams={searchParams}
            />
            <FilterGroup
              label="Regions"
              paramKey="region"
              options={regionOptions}
              active={region}
              searchParams={searchParams}
            />
            <FilterGroup
              label="Platforms"
              paramKey="platform"
              options={platformOptions}
              active={platform}
              searchParams={searchParams}
            />
          </div>
        </aside>

        <div className="min-w-0 lg:col-span-3">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Opportunities
            </h2>
            <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm font-semibold text-slate-300">
              {jobs.length} role{jobs.length === 1 ? "" : "s"}
            </span>
          </header>
          <p className="mt-1 text-sm text-slate-400">
            {hasFilters
              ? "Filtered to match your criteria."
              : "The latest roles from leading AI labs and platforms."}
          </p>

          {jobs.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
              <p className="text-lg font-semibold text-white">
                No roles match your filters
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Try clearing a filter or searching for something different.
              </p>
              <Link
                href="/opportunities"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-accent/80"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  title={job.title}
                  labName={job.aiLabName}
                  tags={toTagList(job.tags)}
                  logoUrl={job.platform?.logoUrl}
                  location={
                    [job.region, job.jobLocationType]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  }
                  url={`/api/redirect?id=${job.id}`}
                  slug={job.slug}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}