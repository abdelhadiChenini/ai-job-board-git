import Link from "next/link";

const stats = [
  { label: "Vetted AI specialists", value: "50K+" },
  { label: "Partner platforms & labs", value: "120+" },
  { label: "Median matching time", value: "<48h" },
];

export function Hero() {
  return (
    <section className="bg-navy">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Human expertise for the teams building AI.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-slate-400">
            We connect AI labs and platforms with vetted experts for model
            evaluation, data annotation and quality work — reliable talent at
            any scale, whenever you need it.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700"
            >
              Browse Opportunities
            </Link>
            <Link
              href="/experts"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Meet the Experts
            </Link>
          </div>
        </div>

        <aside
          className="rounded-card border border-white/30 bg-white/5 p-6 backdrop-blur-sm sm:p-8"
          aria-label="Company summary"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Why companies choose us
          </p>

          <dl className="mt-8 space-y-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-6 last:border-b-0 last:pb-0"
              >
                <dt className="text-sm text-slate-300">{stat.label}</dt>
                <dd className="text-2xl font-bold tracking-tight text-white">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 text-sm leading-relaxed text-slate-400">
            From one-off evals to ongoing annotation programs, our network
            ships in days — not months.
          </p>
        </aside>
      </div>
    </section>
  );
}

export default Hero;