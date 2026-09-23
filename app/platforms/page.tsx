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
      <section className="full-bleed relative w-full overflow-hidden bg-slate-950 py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(800px 420px at 50% -10%, rgba(56,189,248,0.14), transparent 60%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
              aria-hidden="true"
            />
            AI Work Platforms
          </span>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Discover platforms built around AI work.
          </h1>

          <div className="relative mt-4 w-full max-w-2xl">
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
              className="w-full rounded-full border border-white/15 bg-slate-900/70 py-4 pl-12 pr-5 text-sm text-white placeholder:text-slate-400 backdrop-blur-sm focus:outline-2 focus:outline-accent"
            />
          </div>
        </div>
      </section>

      <section className="full-bleed w-full border-t border-slate-800 bg-slate-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <h2 className="bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Explore AI Work Platforms
            </h2>
            <p className="max-w-2xl text-slate-400">
              Compare platforms, understand what they focus on, and visit the
              ones that fit your skills.
            </p>
          </div>

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
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {platforms.map((platform, index) => (
                <PlatformCard
                  key={platform.id}
                  name={platform.name}
                  description={platform.description}
                  tags={collectTags(platform.jobOffers)}
                  websiteUrl={platform.websiteUrl}
                  featured={index === 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="full-bleed w-full bg-slate-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
        </div>
      </section>
    </>
  );
}