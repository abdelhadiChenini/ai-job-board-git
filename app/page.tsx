import Link from "next/link";
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
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          AI Job Board
        </h1>
        <p className="text-slate-400">
          Hand-picked roles from the world&apos;s leading AI labs and platforms.
        </p>
      </header>

      {jobs.length === 0 ? (
        <section className="site-card mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            No open roles right now
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            New AI positions are posted regularly — check back soon.
          </p>
        </section>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              title={job.title}
              labName={job.aiLabName}
              tags={toTagList(job.tags)}
              url={`/api/redirect?id=${job.id}`}
            />
          ))}
        </section>
      )}

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