import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Companies",
  description:
    "Our B2B talent request platform is currently in beta. Check back soon.",
};

export default function CompaniesPage() {
  return (
    <section className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(800px 420px at 50% -10%, rgba(56,189,248,0.14), transparent 60%)",
        }}
      />

      <div className="relative flex max-w-3xl flex-col items-center gap-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
            aria-hidden="true"
          />
          Coming Soon
        </span>

        <h1 className="bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent sm:text-5xl">
          Scale your AI capabilities with vetted human expertise.
        </h1>

        <p className="max-w-xl text-lg text-slate-400">
          Our B2B talent request platform is currently in beta. Check back
          soon.
        </p>
      </div>
    </section>
  );
}