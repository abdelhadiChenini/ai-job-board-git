import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Check, Minus, Sparkles } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  EARLY_ACCESS_WINDOW_HOURS,
  FREE_DAILY_APPLICATION_LIMIT,
  normalizePlan,
} from "@/lib/subscription";
import UpgradeButton from "@/app/components/UpgradeButton";
import AudienceToggle from "./AudienceToggle";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Clear pricing for both sides of the AI talent market. Experts join and apply 100% free, while companies hire vetted talent with transparent pay-as-you-go rates or an enterprise subscription.",
};

export const dynamic = "force-dynamic";

/**
 * A single source of truth for what the upgrade actually does.
 *
 * These numbers are read from `lib/subscription` rather than written out here
 * so the marketing page cannot quietly drift away from the code that enforces
 * the limits. If the daily limit changes, this page changes with it.
 */
const PRO_PRICE = "$10";

const freeFeatures = [
  `Browse every opportunity on the board`,
  `Apply to up to ${FREE_DAILY_APPLICATION_LIMIT} opportunities per day`,
  `New roles unlock ${EARLY_ACCESS_WINDOW_HOURS} hours after posting`,
  "Standard expert profile",
] as const;

const proFeatures = [
  "Unlimited applications — no daily cap",
  `Early access to new roles, ${EARLY_ACCESS_WINDOW_HOURS} hours before anyone else`,
  'A standout "Pro" badge in the expert directory',
  "AI-Powered CV Builder: Generate unlimited tailored resumes for specific roles.",
  "Interactive AI Training & Certifications: Master rubrics, RLHF, and prompt engineering with guided modules.",
  "Priority support when an application needs attention",
] as const;

const comparison = [
  {
    label: "Applications per day",
    free: `${FREE_DAILY_APPLICATION_LIMIT}`,
    pro: "Unlimited",
  },
  {
    label: "New role access",
    free: `After ${EARLY_ACCESS_WINDOW_HOURS}h`,
    pro: "Immediately",
  },
  { label: "Directory badge", free: "Standard", pro: "Pro badge" },
  { label: "AI CV Builder", free: "Not included", pro: "Included" },
  { label: "Training & Certifications", free: "Not included", pro: "Included" },
  { label: "Support", free: "Standard", pro: "Priority" },
  { label: "Expert profile", free: "Standard", pro: "Standard + Pro badge" },
] as const;

const questions = [
  {
    question: "Is it really free to join as an expert?",
    answer: `Yes. Creating an expert profile, joining the network and applying to opportunities costs nothing. Free accounts can apply to ${FREE_DAILY_APPLICATION_LIMIT} opportunities per rolling day, and Pro is an optional upgrade for people applying at higher volume.`,
  },
  {
    question: "What happens when I hit the daily limit?",
    answer: `Free accounts can apply to ${FREE_DAILY_APPLICATION_LIMIT} opportunities per rolling day. When the cap is reached you can still browse everything, and your applications open again once the window rolls over. Pro removes the cap entirely.`,
  },
  {
    question: "What does early access mean?",
    answer: `New opportunities are held back for ${EARLY_ACCESS_WINDOW_HOURS} hours after they are posted, so bulk-imported listings settle before experts see them. Pro members skip that window and can apply as soon as a role goes live.`,
  },
  {
    question: "How does billing work?",
    answer: `Pro is ${PRO_PRICE} per month and is billed through PayPal. You can cancel at any time from your subscription page; you keep Pro access until the end of the period you already paid for, and it will not renew.`,
  },
  {
    question: "How do I get my Pro badge?",
    answer: "Pro members appear with a Pro badge in the expert directory, which is a quick signal to companies that you are active and serious about the work.",
  },
] as const;

const payAsYouGoFeatures = [
  "Standard, transparent hourly rates for vetted experts",
  "One clear platform fee per engagement — no hidden markups",
  "Scale headcount up or down for each project",
  "Pay only for work that is actually delivered",
] as const;

const enterpriseFeatures = [
  "A dedicated pipeline with cohort onboarding",
  "Volume pricing and bulk seat subscriptions",
  "Managed screening and priority shortlisting",
  "Invoiced billing and a dedicated account manager",
] as const;

const companySteps = [
  {
    title: "Share your brief",
    description: "Tell us the skills, dialects and volume you need.",
  },
  {
    title: "Review vetted talent",
    description: "We shortlist experts screened against your criteria.",
  },
  {
    title: "Start and scale",
    description: "Engage pay-as-you-go or roll out a bulk subscription.",
  },
] as const;

export default async function PricingPage() {
  const session = await getServerSession(authOptions);

  let plan: "FREE" | "PRO" | null = null;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (user) {
      plan = normalizePlan(user.plan);
    }
  }

  const isPro = plan === "PRO";
  const card = "relative flex flex-col rounded-3xl border bg-slate-900/50 p-8";
  const check = "mt-0.5 h-4 w-4 shrink-0";

  const expertPanel = (
    <div className="flex flex-col gap-16">
      {/* 100% free + earning potential */}
      <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-900/40 p-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300">
          100% free for experts
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Join the network and apply for free.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          Creating a profile and applying to opportunities is completely free —
          there is no fee to join and no commission taken from your rate.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Experts set their own rate and typically earn{" "}
          <span className="font-semibold text-white">$8–$20+ per hour</span>,
          with higher earnings for in-demand languages, STEM and senior
          evaluation work.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-accent px-7 py-3 font-semibold text-slate-950 transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Apply as an Expert
          </Link>
          <Link
            href="/opportunities"
            className="rounded-xl border border-slate-700 px-7 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            Browse opportunities
          </Link>
        </div>
      </div>

      {/* Free + Pro cards */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className={`${card} border-slate-800`}>
          <div>
            <h3 className="text-lg font-semibold text-white">Free</h3>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white">
                $0
              </span>
              <span className="text-sm text-slate-500">/month</span>
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Everything you need to get your name in front of companies.
            </p>
          </div>

          <ul className="mt-8 flex flex-1 flex-col gap-3">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm">
                <Check
                  aria-hidden="true"
                  className={`${check} text-slate-500`}
                />
                <span className="text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {plan === "FREE" ? (
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Current plan
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Get started
              </Link>
            )}
          </div>
        </div>

        <div
          className={`${card} border-accent/40 shadow-2xl shadow-accent/10`}
          style={{
            backgroundImage:
              "radial-gradient(600px 320px at 80% -10%, rgba(56,189,248,0.14), transparent 60%)",
          }}
        >
          <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-950">
            Most popular
          </span>

          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              Pro
              <Sparkles aria-hidden="true" className="h-4 w-4 text-accent" />
            </h3>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white">
                {PRO_PRICE}
              </span>
              <span className="text-sm text-slate-500">/month</span>
            </p>
            <p className="mt-3 text-sm text-slate-400">
              For experts who are applying to more than a few roles a week.
            </p>
          </div>

          <ul className="mt-8 flex flex-1 flex-col gap-3">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm">
                <Check aria-hidden="true" className={`${check} text-accent`} />
                <span className="text-slate-200">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {isPro ? (
              <>
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-accent/40 bg-accent/10 px-6 py-3 font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Current plan — manage billing
                </Link>
                <p className="mt-3 text-center text-xs text-slate-500">
                  You are already on Pro.
                </p>
              </>
            ) : plan === "FREE" ? (
              <>
                <UpgradeButton />
                <p className="mt-3 text-center text-xs text-slate-500">
                  Billed monthly through PayPal. Cancel any time.
                </p>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Sign up to upgrade
                </Link>
                <p className="mt-3 text-center text-xs text-slate-500">
                  Create a free account first, then upgrade in one click.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div>
        <h3 className="text-center text-2xl font-bold tracking-tight text-white">
          Compare the expert plans
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-400">
          The real difference is how many roles you can reach, and how fast.
        </p>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-widest text-slate-500">
                <th className="py-3 pr-4 font-semibold">Feature</th>
                <th className="py-3 pr-4 font-semibold">Free</th>
                <th className="py-3 font-semibold text-accent">Pro</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.label} className="border-b border-slate-800/60">
                  <th
                    scope="row"
                    className="py-4 pr-4 font-medium text-slate-300"
                  >
                    {row.label}
                  </th>
                  <td className="py-4 pr-4 text-slate-400">
                    {row.label === "Directory badge" && (
                      <Minus
                        aria-hidden="true"
                        className="h-4 w-4 text-slate-600"
                      />
                    )}
                    {row.label !== "Directory badge" && row.free}
                  </td>
                  <td className="py-4 font-semibold text-white">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h3 className="text-center text-2xl font-bold tracking-tight text-white">
          Questions from experts
        </h3>

        <div className="mt-10 flex flex-col gap-4">
          {questions.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-colors hover:border-slate-700"
            >
              <summary className="cursor-pointer list-none text-base font-semibold text-white marker:hidden">
                {item.question}
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );

  const companyPanel = (
    <div className="flex flex-col gap-12">
      <div className="overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-slate-900/40 p-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-300">
          For companies — hiring
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Hire vetted AI talent, your way.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          Choose transparent pay-as-you-go rates for one-off projects, or an
          enterprise subscription for a continuous, managed pipeline.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Pay-as-you-go */}
        <div className={`${card} border-slate-800`}>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Pay-as-you-go
            </h3>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white">
                Standard
              </span>
              <span className="text-sm text-slate-500">hourly rates</span>
            </p>
            <p className="mt-3 text-sm text-slate-400">
              A transparent hourly expert rate plus a platform fee. No retainer
              and no minimum commitment.
            </p>
          </div>

          <ul className="mt-8 flex flex-1 flex-col gap-3">
            {payAsYouGoFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm">
                <Check
                  aria-hidden="true"
                  className={`${check} text-slate-500`}
                />
                <span className="text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              href="/for-companies"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Start Hiring
            </Link>
          </div>
        </div>

        {/* Enterprise */}
        <div
          className={`${card} border-blue-500/40 shadow-2xl shadow-blue-500/10`}
          style={{
            backgroundImage:
              "radial-gradient(600px 320px at 80% -10%, rgba(59,130,246,0.16), transparent 60%)",
          }}
        >
          <span className="absolute -top-3 left-8 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Best for scale
          </span>

          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              Enterprise / Bulk Subscription
              <Sparkles aria-hidden="true" className="h-4 w-4 text-blue-400" />
            </h3>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white">
                Custom
              </span>
              <span className="text-sm text-slate-500">volume pricing</span>
            </p>
            <p className="mt-3 text-sm text-slate-400">
              A dedicated pipeline with bulk seat subscriptions and managed
              screening for sustained hiring.
            </p>
          </div>

          <ul className="mt-8 flex flex-1 flex-col gap-3">
            {enterpriseFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm">
                <Check aria-hidden="true" className={`${check} text-blue-400`} />
                <span className="text-slate-200">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Book a Demo
            </Link>
            <p className="mt-3 text-center text-xs text-slate-500">
              Custom quote — we reply within one business day.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
        <h3 className="text-lg font-semibold text-white">How hiring works</h3>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {companySteps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-600/30 bg-blue-600/15 text-sm font-bold text-blue-400">
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-slate-100">
                {step.title}
              </p>
              <p className="text-sm text-slate-400">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );

  return (
    <>
      <section className="full-bleed w-full bg-slate-950 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
            Pricing
          </span>

          <h1 className="mt-6 bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent lg:text-5xl">
            Clear pricing for both sides of the AI talent market.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Companies hire vetted AI experts at transparent rates. Experts join
            the network and apply for work 100% free.
          </p>
        </div>
      </section>

      <section className="full-bleed w-full border-y border-slate-800 bg-slate-900/30 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-20">
          <AudienceToggle experts={expertPanel} companies={companyPanel} />
        </div>
      </section>
    </>
  );
}
