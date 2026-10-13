const differentiators = [
  {
    title: "Vetted AI Specialists",
    description:
      "We don't do general IT. Our network consists exclusively of tested AI trainers, linguists, and annotators.",
    path: "M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z",
  },
  {
    title: "Regional Expertise",
    description:
      "Direct access to hard-to-find talent in the EMEA region, specializing in Arabic dialects and nuanced localization.",
    path: "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418",
  },
  {
    title: "Scale on Demand",
    description:
      "From a single expert to a full evaluation team, skip the screening process and start your project in days, not weeks.",
    path: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  },
] as const;

export function WhyAmeelai() {
  return (
    <section aria-labelledby="why-ameelai-heading" className="mt-16">
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
            aria-hidden="true"
          />
          For Companies
        </span>

        <h2
          id="why-ameelai-heading"
          className="bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent"
        >
          Why hire through Ameelai?
        </h2>

        <p className="max-w-2xl text-slate-400">
          A curated network built for AI work — not a generic talent
          marketplace.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {differentiators.map((item) => (
          <div
            key={item.title}
            className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-800/50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-accent">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={item.path} />
              </svg>
            </span>

            <h3 className="mt-4 text-lg font-semibold text-slate-100">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <a
          href="/companies"
          className="rounded-full bg-accent px-7 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Hire Vetted Experts
        </a>
      </div>
    </section>
  );
}

export default WhyAmeelai;
