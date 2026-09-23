import SearchBar from "@/components/SearchBar";
import { prisma } from "@/lib/prisma";

const trendTags = [
  "OpenAI",
  "Anthropic",
  "Google DeepMind",
  "Scale AI",
  "Cohere",
  "Surge AI",
  "Meta AI",
  "xAI",
];

const heroStats = [
  { label: "Active roles", value: "2,400+" },
  { label: "Avg. hourly rate", value: "$125/hr" },
  { label: "Verified talent", value: "98%" },
];

export async function Hero() {
  const [platforms, jobs] = await Promise.all([
    prisma.aIPlatform.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    prisma.jobOffer.findMany({
      select: { tags: true, jobLocationType: true },
    }),
  ]);

  const companies = platforms.map((platform) => platform.name).sort();

  const categorySet = new Set<string>();
  for (const job of jobs) {
    if (!Array.isArray(job.tags)) continue;
    for (const tag of job.tags) {
      if (typeof tag === "string" && tag.trim()) {
        categorySet.add(tag);
      }
    }
  }
  const categories = Array.from(categorySet).sort();

  const locations = Array.from(
    new Set(jobs.map((job) => job.jobLocationType).filter(Boolean)),
  ).sort();

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(900px 500px at 80% -10%, rgba(56,189,248,0.15), transparent 60%), radial-gradient(700px 420px at 0% 110%, rgba(16,185,129,0.1), transparent 60%)",
        }}
      />

      <div className="relative grid grid-cols-1 items-center gap-12 pt-16 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-8">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
              aria-hidden="true"
            />
            Curated AI &amp; Remote Work
          </span>

          <h1 className="max-w-3xl bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-5xl font-extrabold leading-[1.05] tracking-tight text-transparent sm:text-6xl lg:text-7xl">
            Find work shaping the future of AI.
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
            We connect AI labs and platforms with vetted experts for model
            evaluation, data annotation and quality work — reliable talent at
            any scale, whenever you need it.
          </p>

          <SearchBar
            companies={companies}
            categories={categories}
            locations={locations}
          />
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            className={`animate-float rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-blue-500/10 backdrop-blur-md`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Live Opportunities
              </p>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                Live
              </span>
            </div>

            <ul className="mt-5 flex flex-wrap gap-2">
              {trendTags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
                >
                  {tag}
                </li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-slate-950/60">
              {heroStats.map((stat) => (
                <div key={stat.label} className="px-3 py-4 text-center">
                  <p className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-lg font-extrabold tracking-tight text-transparent sm:text-xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Roles filled this week</span>
                <span className="font-semibold text-slate-300">312 / 400</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400"
                  style={{ width: "78%" }}
                />
              </div>
            </div>
          </div>

          <div className="absolute -left-6 -top-6 hidden h-24 w-24 animate-float-delayed rounded-2xl border border-white/10 bg-gradient-to-br from-accent/20 to-emerald-400/10 backdrop-blur-md sm:block" />
          <div className="absolute -bottom-8 -right-4 hidden h-32 w-32 animate-float rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md sm:block">
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <span
                className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"
                aria-hidden="true"
              />
              <p className="px-4 text-center text-xs font-bold text-white">
                $125/hr
              </p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                Avg. rate
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;