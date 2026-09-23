import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Companies",
  description:
    "Access a curated network of domain experts, regional language specialists, and top-tier evaluators to build, train, and refine your AI pipelines.",
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-emerald-400"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const mockupItems = [
  {
    title: "Target exact skillsets",
    description: "Surface opportunities exclusively to qualified specialists.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-accent"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
        <path d="M15 11s1-1 1-2.5S14.5 6.5 14.5 6.5" />
      </svg>
    ),
  },
  {
    title: "Streamline candidate influx",
    description:
      "Consolidate applications into a clean, reviewable pipeline.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-accent"
      >
        <path d="M3 13h4l2 3 4-8 2 5h6" />
        <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
      </svg>
    ),
  },
  {
    title: "Screen for deep accuracy",
    description:
      "Filter by specific coding languages, dialects, or STEM degrees.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-accent"
      >
        <path d="M9 3v18M3 5v14M15 7v10M21 9v6" />
      </svg>
    ),
  },
];

const quickCapabilities = [
  "Prompt Evaluation",
  "Data Annotation",
  "Regional Linguistics",
  "Subject Matter Experts",
  "Multimodal Collection",
];

const models = [
  {
    number: "01",
    title: "Direct Pipeline Integration",
    description:
      "Seamlessly route high-intent specialists straight to your existing ATS or onboarding portal. Ideal for established workflows.",
  },
  {
    number: "02",
    title: "Managed Application Hub",
    description:
      "Utilize our platform to collect and centralize candidate interest before your team begins the review phase. Ideal for custom project cohorts.",
  },
  {
    number: "03",
    title: "Premium Shortlisting",
    description:
      "Rely on our team to screen candidates against rigorous linguistic or technical benchmarks prior to handoff. Ideal for complex SME roles.",
  },
];

const processSteps = [
  {
    title: "Submit your project brief",
    description:
      "Define roles, dialect and technical requirements, and volume targets.",
  },
  {
    title: "Select your pipeline model",
    description:
      "Choose the sourcing flow that fits your review bandwidth.",
  },
  {
    title: "Connect with elite talent",
    description:
      "Match with specialists pre-screened against your exact criteria.",
  },
  {
    title: "Integrate and scale",
    description:
      "Move vetted candidates into your workflow and scale as demand grows.",
  },
];

const coverage = [
  {
    title: "AI Evaluators",
    description: "RLHF, prompt grading, model alignment",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      </svg>
    ),
  },
  {
    title: "Data Annotators",
    description: "Text classification, bounding boxes, QA",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    title: "Regional Linguists",
    description: "Dialect adaptation, nuanced translation",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
      </svg>
    ),
  },
  {
    title: "Code Reviewers",
    description: "Algorithm optimization, logic verification",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />
      </svg>
    ),
  },
  {
    title: "STEM Experts",
    description: "Advanced mathematics, chemistry, physics",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path d="M10 2v8L3 19a2 2 0 0 0 1.7 3.2h11.4A2 2 0 0 0 18 19l-7-9V2M8 2h8M7 15h10" />
      </svg>
    ),
  },
  {
    title: "Professional Analysts",
    description: "Legal, financial, and medical logic",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </svg>
    ),
  },
  {
    title: "Creative Specialists",
    description: "Fact-checking, creative writing synthesis",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path d="m12 20 9-16H3l5 9 4 7Z" />
      </svg>
    ),
  },
  {
    title: "Multimodal Collectors",
    description: "Audio recording, dialect capture, video",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
      </svg>
    ),
  },
];

export default function ForCompaniesPage() {
  return (
    <>
      <section className="full-bleed relative w-full bg-slate-950">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(900px 480px at 20% -10%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(700px 380px at 90% 10%, rgba(16,185,129,0.1), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col items-start gap-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                Enterprise AI Talent
              </span>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
                Fuel your AI models with vetted human intelligence.
              </h1>

              <p className="max-w-xl text-lg leading-relaxed text-slate-400">
                Access a curated network of domain experts, regional language
                specialists, and top-tier evaluators to build, train, and
                refine your AI pipelines.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Request Talent →
                </a>
                <a
                  href="#process"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-6 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-800"
                >
                  Explore Capabilities
                </a>
              </div>

              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Verified specialists
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Scalable teams
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Global dialects &amp; domains
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Aligned with your data pipeline
              </h2>
              <ul className="mt-6 flex flex-col gap-5">
                {mockupItems.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 md:grid-cols-5">
            {quickCapabilities.map((capability) => (
              <div
                key={capability}
                className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3 text-center text-sm font-semibold text-slate-300"
              >
                {capability}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="full-bleed w-full border-y border-slate-800 bg-slate-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent"
                aria-hidden="true"
              />
              Scalable Workflows
            </span>
            <h2 className="max-w-2xl bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent lg:text-4xl">
              Engagement that fits your operational cadence.
            </h2>
            <p className="max-w-2xl text-lg text-slate-400">
              Adopt the sourcing strategy that maps directly to your internal
              review bandwidth.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {models.map((model) => (
              <div
                key={model.number}
                className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700"
              >
                <span className="text-sm font-bold tracking-widest text-accent">
                  {model.number}
                </span>
                <h3 className="text-lg font-semibold text-slate-100">
                  {model.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {model.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="process"
        className="full-bleed w-full scroll-mt-20 bg-slate-950 py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col items-start gap-4">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                Precision Scoping
              </span>
              <h2 className="bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent lg:text-4xl">
                Define the mission, we deliver the minds.
              </h2>
              <p className="max-w-xl text-lg leading-relaxed text-slate-400">
                Outline your dialect requirements, technical frameworks, and
                volume constraints. We handle the targeting.
              </p>
            </div>

            <ol className="flex flex-col gap-4">
              {processSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-600/30 bg-blue-600/15 text-sm font-bold text-blue-400">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-400">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="full-bleed w-full border-t border-slate-800 bg-slate-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <h2 className="bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent lg:text-4xl">
              Multidimensional talent for complex model training.
            </h2>
            <p className="max-w-2xl text-lg text-slate-400">
              Frontier AI requires diverse human feedback across the entire
              development lifecycle.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {coverage.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-accent">
                  {item.icon}
                </span>
                <h3 className="text-sm font-semibold leading-snug text-slate-100">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="full-bleed w-full bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 rounded-3xl border border-blue-900/40 bg-gradient-to-br from-slate-900 to-slate-950 p-10 text-center shadow-2xl md:flex-row md:text-left">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
                aria-hidden="true"
              />
              Initiate a Project
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Ready to scale your human feedback?
            </h2>
            <p className="max-w-xl text-slate-400">
              Whether you need high-volume annotation or a handful of niche
              technical reviewers, outline your needs and we will assemble the
              team.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Request Talent →
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </>
  );
}