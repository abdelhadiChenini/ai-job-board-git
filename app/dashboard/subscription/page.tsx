import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";
import { getSubscriptionDetails, PayPalError } from "@/lib/paypal";
import DashboardSidebar from "../DashboardSidebar";
import UpgradeButton from "@/app/components/UpgradeButton";

export const metadata: Metadata = {
  title: "Subscription",
};

export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<"FREE" | "PRO", string> = {
  FREE: "Free",
  PRO: "Pro",
};

/**
 * Paid access lasts until the end of the period that was bought, so the next
 * billing date is the honest deadline. A cancelled subscription has no next
 * billing date at all, which is exactly when access runs out.
 */
function describeExpiry(
  nextBillingTime: string | null,
): { label: string; detail: string } | null {
  if (!nextBillingTime) {
    return null;
  }

  const date = new Date(nextBillingTime);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    label: date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    detail: date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  };
}

export default async function DashboardSubscriptionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/subscription");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      plan: true,
      paypalSubscriptionId: true,
      planChangeLogs: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          oldPlan: true,
          newPlan: true,
          changedBy: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const plan = normalizePlan(user.plan);
  const subscriptionId = user.paypalSubscriptionId;

  // Only ask PayPal when there is something to ask about. The call is wrapped
  // because a billing page that 500s because PayPal is unreachable would block
  // a user from even seeing what plan they are on.
  let paypalStatus: string | null = null;
  let expiry: { label: string; detail: string } | null = null;
  let paypalError: string | null = null;

  if (subscriptionId) {
    try {
      const details = await getSubscriptionDetails(subscriptionId);
      paypalStatus = details.status;
      expiry = describeExpiry(details.billing_info?.next_billing_time ?? null);
    } catch (error) {
      console.error("[subscription] could not reach PayPal:", error);
      paypalError =
        error instanceof PayPalError
          ? "PayPal did not answer. Your plan is unchanged and still active."
          : "Could not load live subscription details.";
    }
  }

  const card = "rounded-card border border-white/10 bg-slate-800 p-6";
  const label = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <DashboardSidebar />

      <div className="min-w-0 flex-1">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Subscription
          </h1>
          <p className="text-sm text-slate-400">
            Manage your Pro access and billing details.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <section className={card}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={label}>Current plan</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {PLAN_LABEL[plan]}
                </p>
                <p className="mt-1 text-sm text-slate-400">{user.email}</p>
              </div>

              <span
                className={
                  plan === "PRO"
                    ? "rounded-full bg-amber-400/15 px-3 py-1 text-sm font-semibold text-amber-300"
                    : "rounded-full bg-slate-500/15 px-3 py-1 text-sm font-semibold text-slate-300"
                }
              >
                {plan === "PRO" ? "Pro member" : "Free tier"}
              </span>
            </div>

            {expiry && (
              <div className="mt-5 border-t border-slate-700/60 pt-5">
                <p className={label}>
                  {paypalStatus === "CANCELLED"
                    ? "Access ends"
                    : "Next payment"}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {expiry.label}
                </p>
                <p className="text-xs text-slate-500">{expiry.detail}</p>
                {paypalStatus === "CANCELLED" && (
                  <p className="mt-2 text-sm text-amber-300">
                    Your subscription is cancelled. You keep Pro access until
                    this date, and it will not renew.
                  </p>
                )}
              </div>
            )}

            {paypalStatus && !expiry && plan === "PRO" && (
              <p className="mt-5 border-t border-slate-700/60 pt-5 text-sm text-slate-400">
                No upcoming payment is scheduled.
              </p>
            )}

            {paypalError && (
              <p role="status" className="mt-5 text-sm text-amber-300">
                {paypalError}
              </p>
            )}

            {subscriptionId && (
              <div className="mt-5 border-t border-slate-700/60 pt-5">
                <p className={label}>PayPal subscription ID</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-400">
                  {subscriptionId}
                </p>
                {paypalStatus && (
                  <p className="mt-2 text-xs text-slate-500">
                    Status at PayPal: {paypalStatus}
                  </p>
                )}
              </div>
            )}
          </section>

          {plan === "FREE" && (
            <section className={card}>
              <p className={label}>Upgrade</p>
              <h2 className="mt-1 text-xl font-bold text-white">
                Get unlimited applications
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Pro removes the daily application limit and gives you early
                access to newly posted roles.
              </p>
              <div className="mt-5">
                <UpgradeButton />
              </div>
            </section>
          )}

          {user.planChangeLogs.length > 0 && (
            <section className={card}>
              <p className={label}>Plan history</p>
              <ul className="mt-4 flex flex-col gap-3">
                {user.planChangeLogs.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/40 pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <span className="text-slate-300">
                      <span className="font-semibold text-white">
                        {entry.oldPlan}
                      </span>
                      {" → "}
                      <span className="font-semibold text-white">
                        {entry.newPlan}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {entry.changedBy === "admin"
                        ? "by an administrator"
                        : entry.changedBy === "reconcile"
                          ? "by reconciliation"
                          : "by PayPal"}
                      {" · "}
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
