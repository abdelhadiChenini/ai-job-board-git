import Link from "next/link";
import type { Metadata } from "next";
import ExpertCard from "@/app/components/ExpertCard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "AI Experts Directory",
};

export const revalidate = 60;

function toSkillList(skills: unknown): string[] {
  if (!Array.isArray(skills)) {
    return [];
  }
  return skills.filter((skill): skill is string => typeof skill === "string");
}

export default async function ExpertsPage() {
  const experts = await prisma.expert.findMany({
    select: {
      name: true,
      title: true,
      bio: true,
      skills: true,
      email: true,
      twitterUrl: true,
      linkedinUrl: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          AI Experts
        </h1>
        <p className="text-slate-400">
          Standalone profiles from AI researchers, engineers and product
          leaders.
        </p>
      </header>

      {experts.length === 0 ? (
        <section className="site-card mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            No experts listed yet
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Independent expert profiles will appear here soon.
          </p>
        </section>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {experts.map((expert) => (
            <ExpertCard
              key={expert.email ?? expert.name}
              name={expert.name}
              title={expert.title}
              bio={expert.bio}
              skills={toSkillList(expert.skills)}
              email={expert.email}
              twitterUrl={expert.twitterUrl}
              linkedinUrl={expert.linkedinUrl}
            />
          ))}
        </section>
      )}

      <footer className="mt-10 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300">
          Back to jobs
        </Link>
      </footer>
    </>
  );
}