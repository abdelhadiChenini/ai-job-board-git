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

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free with 3 applications a day, or upgrade to Pro for unlimited applications, early access to new roles, and a Pro badge in the expert directory.",
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
  { label: "Support", free: "Standard", pro: "Priority" },
  { label: "Expert profile", free: "Standard", pro: "Standard + Pro badge" },
] as const;

const questions = [
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

  return (
    <>
      <section className="full-bleed w-full bg-slate-950 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
            Pricing
          </span>

          <h1 className="mt-6 bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent lg:text-5xl">
            One plan should not decide whether you get the interview.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Start free and browse everything. Upgrade to Pro when you want to
            apply without a daily ceiling and see new roles before anyone else.
          </p>
        </div>
      </section>

      <section className="full-bleed w-full border-y border-slate-800 bg-slate-900/30 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 md:grid-cols-2 lg:px-20">
          {/* Free */}
          <div className={`${card} border-slate-800`}>
            <div>
              <h2 className="text-lg font-semibold text-white">Free</h2>
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
                    className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
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

          {/* Pro */}
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
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                Pro
                <Sparkles aria-hidden="true" className="h-4 w-4 text-accent" />
              </h2>
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
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  />
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
      </section>

      <section className="full-bleed w-full bg-slate-950 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Compare the plans
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            The real difference is how many roles you can reach, and how fast.
          </p>

          <div className="mt-12 overflow-x-auto">
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
      </section>

      <section className="full-bleed w-full border-t border-slate-800 bg-slate-900/30 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Questions
          </h2>

          <div className="mt-12 flex flex-col gap-4">
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

          {!isPro && (
            <div className="mt-16 rounded-3xl border border-accent/20 bg-gradient-to-br from-slate-900 to-slate-950 p-10 text-center shadow-2xl">
              <h3 className="text-2xl font-bold text-white">
                Ready to apply without limits?
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
                {plan === "FREE"
                  ? "Upgrade now and unlock every opportunity the moment it is posted."
                  : "Create a free account, then upgrade whenever you are ready."}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                {plan === "FREE" ? (
                  <Link
                    href="/dashboard/subscription"
                    className="rounded-xl bg-accent px-7 py-3 font-semibold text-slate-950 transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    View my subscription
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="rounded-xl bg-accent px-7 py-3 font-semibold text-slate-950 transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Create free account
                  </Link>
                )}
                <Link
                  href="/opportunities"
                  className="rounded-xl border border-slate-700 px-7 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-800"
                >
                  Browse opportunities
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
