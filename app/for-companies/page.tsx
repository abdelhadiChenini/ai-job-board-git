import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Companies",
  description:
    "Reach multidisciplinary talent for AI evaluation, annotation, data collection, multilingual benchmarking, and domain-specialist projects.",
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
    title: "Reach relevant contributors",
    description: "Put your opportunity in front of active specialists.",
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
        <path d="M14 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM16 21l-1.5-7.5L18 15l6-2M7 21v-6l-2-1 1.5-4L4 9M14 12l1.5 4.5L18 21M4 9l-1.5 1.5L7 13" />
      </svg>
    ),
  },
  {
    title: "Collect candidate interest",
    description: "Centralize applications tailored to your pipeline.",
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
        <path d="M3 11l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    title: "Source against specific requirements",
    description:
      "Precise screening by language dialect, degree, or technical domain.",
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
        <circle cx="10" cy="10" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
];

const quickCapabilities = [
  "AI Evaluation",
  "Data Annotation",
  "Multilingual AI",
  "Domain Experts",
  "Data Collection",
];

const models = [
  {
    number: "01",
    title: "Direct applicant referral",
    description:
      "Instant distribution to relevant talent directly to your application portal. Best for teams with existing pipelines.",
  },
  {
    number: "02",
    title: "Application collection",
    description:
      "Centralized collection and screening through our platform before review. Best for custom project cohorts.",
  },
  {
    number: "03",
    title: "Sourcing & shortlisting",
    description:
      "Dedicated screening against stringent benchmarks and languages before handoff. Best for high-complexity SME & RLHF roles.",
  },
];

const processSteps = [
  {
    title: "Share your talent brief",
    description:
      "Outline roles, volumes, language requirements, and domain nuances.",
  },
  {
    title: "Choose the sourcing model",
    description:
      "Pick referral, collection, or managed sourcing to fit your workflow.",
  },
  {
    title: "Match verified talent",
    description:
      "Our network is screened for relevance before anything reaches you.",
  },
  {
    title: "Move candidates into your workflow",
    description:
      "Deliver vetted candidates straight into your interviewing pipeline.",
  },
];

const coverage = [
  {
    title: "AI trainers & evaluators",
    description: "RLHF, model feedback, grading",
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
    title: "Annotators & labelers",
    description: "Computer vision, text classification, audio",
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
        <path d="M20.6 13.4 12 22l-8.6-8.6A5 5 0 1 1 10.6 4l1.4 1.4L13.4 4a5 5 0 1 1 7.2 9.4Z" />
      </svg>
    ),
  },
  {
    title: "Language specialists",
    description: "Dialect adaptation, translation, localization",
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
    title: "Technical talent",
    description: "Code generation, Python, system benchmarking",
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
    title: "STEM experts",
    description: "Mathematics, physics, organic chemistry",
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
    title: "Professional experts",
    description: "Legal analysis, finance, medical SMEs",
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
    title: "Writers & content experts",
    description: "Creative synthesis, fact-checking, editorial",
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
    title: "Data contributors",
    description: "Speech recording, image collection, native dialect capture",
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
                For AI Labs &amp; Enterprises
              </span>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
                Human expertise for the teams building AI.
              </h1>

              <p className="max-w-xl text-lg leading-relaxed text-slate-400">
                Reach multidisciplinary talent for AI evaluation, annotation,
                data collection, multilingual benchmarking, and
                domain-specialist projects.
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
                  See How It Works
                </a>
              </div>

              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Multidisciplinary talent
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Flexible sourcing models
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Global coverage
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Built around your hiring &amp; project workflow
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
              Flexible Engagement
            </span>
            <h2 className="max-w-2xl bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent lg:text-4xl">
              Work at the level your team needs.
            </h2>
            <p className="max-w-2xl text-lg text-slate-400">
              Choose the sourcing model that integrates directly into your
              team&rsquo;s workflow.
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
                A Focused Process
              </span>
              <h2 className="bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent lg:text-4xl">
                Start with requirements, not a generic job post.
              </h2>
              <p className="max-w-xl text-lg leading-relaxed text-slate-400">
                Specify dialect nuances, technical frameworks, volume targets,
                and reviewer seniority. That brief dictates the sourcing flow.
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
              One network. Different kinds of expertise.
            </h2>
            <p className="max-w-2xl text-lg text-slate-400">
              AI projects demand diverse specialist profiles across the entire
              model lifecycle.
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
              Start a Conversation
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Tell us what your team needs.
            </h2>
            <p className="max-w-xl text-slate-400">
              Whether you need rapid contributor scaling or niche linguistic
              SMEs, submit a brief and we will match the right talent.
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
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}