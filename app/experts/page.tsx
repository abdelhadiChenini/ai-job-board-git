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

function profileUrlFor(expert: {
  linkedinUrl: string | null;
  twitterUrl: string | null;
  email: string | null;
}): string {
  return (
    expert.linkedinUrl ??
    expert.twitterUrl ??
    (expert.email ? `mailto:${expert.email}` : "#")
  );
}

export default async function ExpertsPage() {
  const experts = await prisma.expert.findMany({
    select: {
      name: true,
      title: true,
      skills: true,
      email: true,
      twitterUrl: true,
      linkedinUrl: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <section className="bg-navy">
        <div className="flex flex-col items-center gap-6 pt-4 text-center sm:pt-6">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Discover professionals helping shape AI.
          </h1>
          <p className="max-w-xl text-slate-400">
            Independent researchers, engineers and product leaders bringing
            deep expertise to AI labs and platforms.
          </p>
          <div className="flex w-full max-w-3xl flex-col items-stretch gap-2 rounded-2xl bg-white p-2.5 text-left shadow-xl shadow-black/30 sm:flex-row sm:gap-0 sm:p-2 lg:grid lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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
                placeholder="Search by name, expertise or skill"
                aria-label="Search by name, expertise or skill"
                className="w-full rounded-xl bg-transparent px-4 py-3.5 pl-11 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none lg:h-full"
              />
            </div>

            <div className="relative sm:border-l sm:border-slate-200">
              <select
                name="country"
                defaultValue=""
                aria-label="All Countries"
                className="h-full w-full appearance-none bg-transparent px-4 py-3.5 pr-10 text-sm text-slate-600 focus:outline-none"
              >
                <option value="">All Countries</option>
              </select>
              <svg
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="-mx-4 my-8 bg-paper px-4 py-16 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Expert network
          </h2>
          <p className="max-w-2xl text-slate-600">
            Vetted professionals available for model evaluation, data
            annotation and AI quality projects.
          </p>
        </div>

        {experts.length === 0 ? (
          <div className="mt-10 rounded-card border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              No experts listed yet
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Independent expert profiles will appear here soon.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {experts.map((expert) => (
              <ExpertCard
                key={expert.email ?? expert.name}
                name={expert.name}
                title={expert.title}
                skills={toSkillList(expert.skills)}
                profileUrl={profileUrlFor(expert)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}