import TopNav from "@/app/components/TopNav";
import Hero from "@/app/components/Hero";
import JobCard from "@/app/components/JobCard";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function toTagList(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.filter((tag): tag is string => typeof tag === "string");
}

function platformInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

type SearchParams = {
  q?: string;
  category?: string;
  company?: string;
  location?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = searchParams.q?.trim();
  const category = searchParams.category?.trim();
  const company = searchParams.company?.trim();
  const location = searchParams.location?.trim();

  const where: Prisma.JobOfferWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (company) {
    where.platform = { name: company };
  }
  if (category) {
    where.tags = { array_contains: category };
  }
  if (location) {
    where.jobLocationType = location;
  }

  const [jobs, platforms] = await Promise.all([
    prisma.jobOffer.findMany({
      select: {
        id: true,
        title: true,
        aiLabName: true,
        tags: true,
      },
      where,
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.aIPlatform.findMany({
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        description: true,
      },
      orderBy: { name: "asc" },
      take: 8,
    }),
  ]);

  return (
    <>
      <TopNav />

      <Hero />

      <div
        role="note"
        className="mt-8 flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-yellow-200"
      >
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm leading-relaxed">
          Transparency notice: some listings on this site are affiliate links,
          and we may earn a commission when you apply through them. This never
          affects your chances of getting hired or a platform&apos;s rating.
        </p>
      </div>

      <section className="py-20">
        <header className="flex flex-wrap items-center gap-3">
          <h2 className="bg-gradient-to-r from-white to-accent bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Trending Opportunities
          </h2>
          <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm font-semibold text-slate-300">
            {jobs.length}
          </span>
        </header>
        <p className="mt-3 text-slate-400">
          Hand-picked roles from the world&apos;s leading AI labs and
          platforms.
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
          <div className="hide-scrollbar mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2">
            {jobs.map((job) => (
              <div key={job.id} className="w-80 shrink-0 snap-center">
                <JobCard
                  title={job.title}
                  labName={job.aiLabName}
                  tags={toTagList(job.tags)}
                  url={`/api/redirect?id=${job.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="py-16">
        <header>
          <h2 className="bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Explore AI Work Platforms
          </h2>
          <p className="mt-3 text-slate-400">
            Partners hiring for AI training, data quality and evaluation
            projects.
          </p>
        </header>

        {platforms.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              No platforms listed yet
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              New AI platforms will appear here soon.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {platforms.map((platform) => (
              <a
                key={platform.id}
                href={platform.websiteUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 text-slate-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-sm font-bold text-blue-700">
                  {platformInitials(platform.name)}
                </span>
                <h3 className="text-sm font-bold leading-snug">
                  {platform.name}
                </h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                  {platform.description ?? "Partner AI platform."}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 px-6 py-16 text-center sm:px-16">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(600px 320px at 50% -20%, rgba(56,189,248,0.18), transparent 60%), radial-gradient(500px 300px at 90% 120%, rgba(16,185,129,0.14), transparent 60%)",
            }}
          />
          <div className="relative flex flex-col items-center gap-6">
            <h2 className="max-w-3xl bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent sm:text-5xl">
              Find AI work. Or find the talent to get it done.
            </h2>
            <p className="max-w-xl text-lg text-slate-400">
              Join a growing community of vetted AI experts and the platforms
              that need them.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/register"
                className="rounded-full bg-accent px-7 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Create Free Account
              </a>
              <a
                href="/login"
                className="rounded-full border border-white/15 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-accent/60 hover:text-accent"
              >
                Log In
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}