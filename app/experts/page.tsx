import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ExpertCard from "@/app/components/ExpertCard";
import FilterSidebar from "@/components/FilterSidebar";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "AI Experts Directory",
};

export const revalidate = 60;

type SearchParams = {
  q?: string;
  availability?: string;
  specialty?: string | string[];
};

function toSkillList(skills: unknown): string[] {
  if (!Array.isArray(skills)) {
    return [];
  }
  return skills.filter((skill): skill is string => typeof skill === "string");
}

export default async function ExpertsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = searchParams.q?.trim();
  const availability = searchParams.availability;
  const specialties = Array.isArray(searchParams.specialty)
    ? searchParams.specialty
    : searchParams.specialty
      ? [searchParams.specialty]
      : [];

  const filters: Prisma.ExpertProfileWhereInput[] = [
    { isPublic: true },
  ];

  if (availability) {
    filters.push({
      availability:
        availability === "Available" ? "Available for Work" : "Not Looking",
    });
  }

  if (specialties.length > 0) {
    filters.push({
      OR: specialties.map((specialty) => ({
        skills: { array_contains: specialty },
      })),
    });
  }

  const where: Prisma.ExpertProfileWhereInput = { AND: filters };
  if (q) {
    where.OR = [
      { fullName: { contains: q } },
      { headline: { contains: q } },
      { skills: { array_contains: q } },
    ];
  }

  const experts = await prisma.expertProfile.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      headline: true,
      skills: true,
    },
    orderBy: { fullName: "asc" },
  });

  const hasFilters = Boolean(q || availability || specialties.length > 0);

  return (
    <>
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(800px 420px at 50% -10%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(600px 360px at 90% 110%, rgba(16,185,129,0.1), transparent 60%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
              aria-hidden="true"
            />
            Vetted AI Talent
          </span>
          <h1 className="max-w-3xl bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            Experts helping shape the future of AI.
          </h1>
          <p className="max-w-2xl text-lg text-slate-400">
            Independent researchers, engineers and product leaders bringing
            deep expertise to AI labs and platforms.
          </p>

          <form
            action="/experts"
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
              placeholder="Search by name, expertise or skill..."
              aria-label="Search experts"
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
          <Suspense fallback={<div className="rounded-2xl border border-slate-800 bg-slate-900 p-6" />}>
            <FilterSidebar />
          </Suspense>
        </aside>

        <div className="min-w-0 lg:col-span-3">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Expert network
            </h2>
            <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm font-semibold text-slate-300">
              {experts.length} expert{experts.length === 1 ? "" : "s"}
            </span>
          </header>
          <p className="mt-1 text-sm text-slate-400">
            Vetted professionals available for model evaluation, data
            annotation and AI quality projects.
          </p>

          {experts.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
              <p className="text-lg font-semibold text-white">
                No experts match your filters
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Try clearing a filter or searching for something different.
              </p>
              <Link
                href="/experts"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-accent/80"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {experts.map((expert) => (
                <ExpertCard
                  key={expert.id}
                  name={expert.fullName}
                  title={expert.headline}
                  skills={toSkillList(expert.skills)}
                  profileUrl={`/experts/${expert.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}