import Hero from "@/app/components/Hero";
import TrendingCarousel from "@/components/TrendingCarousel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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

  const [trendingJobPool, platforms] = await Promise.all([
    prisma.jobOffer.findMany({
      include: {
        platform: { select: { name: true, slug: true, logoUrl: true } },
      },
      where: { ...where, badge: "Trending" },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.aIPlatform.findMany({
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        description: true,
        logoUrl: true,
      },
      orderBy: { name: "asc" },
      take: 8,
    }),
  ]);

  const usedPlatformIds = new Set<string>();
  const trendingJobs = trendingJobPool
    .filter((job) => {
      if (usedPlatformIds.has(job.platformId)) {
        return false;
      }
      usedPlatformIds.add(job.platformId);
      return true;
    })
    .slice(0, 12);

  const session = await getServerSession(authOptions);

  let savedOpportunityIds: string[] = [];
  if (session?.user?.id) {
    const savedRows = await prisma.savedOpportunity.findMany({
      where: { userId: session.user.id },
      select: { opportunityId: true },
    });
    savedOpportunityIds = savedRows.map((row) => row.opportunityId);
  }

  return (
    <>
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

      <TrendingCarousel
        jobs={trendingJobs}
        savedOpportunityIds={savedOpportunityIds}
      />

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
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="text-lg font-semibold text-slate-100">
              No platforms listed yet
            </h3>
            <p className="mt-1 text-sm text-slate-400">
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
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-slate-200 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-800/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
              >
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2">
                  {platform.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={platform.logoUrl}
                      alt={`${platform.name} logo`}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-sm font-bold text-slate-300">
                      {platformInitials(platform.name)}
                    </span>
                  )}
                </span>
                <h3 className="text-sm font-semibold leading-snug text-slate-100">
                  {platform.name}
                </h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">
                  {platform.description ?? "Partner AI platform."}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}