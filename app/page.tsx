import Link from "next/link";
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

      <section className="py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">
          Latest Opportunities
        </h2>
        <p className="mt-3 text-center text-slate-400">
          Hand-picked roles from the world&apos;s leading AI labs and platforms.
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
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        )}
      </section>

      <footer className="mt-10 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300">
          About
        </Link>
        {" · "}
        <Link href="/" className="hover:text-slate-300">
          Contact
        </Link>
      </footer>
    </>
  );
}