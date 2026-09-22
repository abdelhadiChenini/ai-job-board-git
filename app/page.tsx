import TopNav from "@/app/components/TopNav";
import Hero from "@/app/components/Hero";
import JobCard from "@/app/components/JobCard";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

function toTagList(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.filter((tag): tag is string => typeof tag === "string");
}

export default async function HomePage() {
  const jobs = await prisma.jobOffer.findMany({
    select: {
      id: true,
      title: true,
      aiLabName: true,
      tags: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <TopNav />

      <Hero />

      <div
        role="note"
        className="mt-8 flex items-start gap-3 rounded-card border border-yellow-200 bg-yellow-100 p-5 text-yellow-900"
      >
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-orange-500"
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
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Explore Opportunities
        </h2>
        <p className="mt-3 text-slate-400">
          Hand-picked roles from the world&apos;s leading AI labs and
          platforms.
        </p>

        {jobs.length === 0 ? (
          <div className="site-card mt-12">
            <h3 className="text-lg font-semibold text-slate-900">
              No open roles right now
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              New AI positions are posted regularly — check back soon.
            </p>
          </div>
        ) : (
          <div className="mt-12">
            <header className="flex items-center gap-3">
              <h3 className="text-2xl font-bold tracking-tight text-white">
                📚 AI Training &amp; Evaluation
              </h3>
              <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm font-semibold text-slate-300">
                {jobs.length}
              </span>
            </header>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  title={job.title}
                  labName={job.aiLabName}
                  tags={toTagList(job.tags)}
                  url={`/api/redirect?id=${job.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}