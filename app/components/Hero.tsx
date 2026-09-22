import SearchBar from "@/components/SearchBar";
import { prisma } from "@/lib/prisma";

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
    <section className="bg-navy">
      <div className="flex flex-col items-start gap-6 pt-8 sm:pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
          <span
            className="h-1.5 w-1.5 rounded-full bg-blue-500"
            aria-hidden="true"
          />
          Curated AI &amp; Remote Work
        </span>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Find work shaping the future of AI.
        </h1>

        <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
          We connect AI labs and platforms with vetted experts for model
          evaluation, data annotation and quality work — reliable talent at any
          scale, whenever you need it.
        </p>

        <SearchBar
          companies={companies}
          categories={categories}
          locations={locations}
        />
      </div>
    </section>
  );
}

export default Hero;