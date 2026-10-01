import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";
import {
  cancelSubscription,
  getSubscription,
  PayPalError,
} from "@/lib/paypal";

export const dynamic = "force-dynamic";

/**
 * Cancels the caller's own PayPal subscription.
 *
 * Two things this deliberately does not do.
 *
 * It does not touch `role`. `role` is the ADMIN/EXPERT enum and the caller is
 * already an EXPERT; the paid tier lives in `plan`, so there is nothing to
 * change there.
 *
 * It does not downgrade `plan` to FREE, and does not clear `paypalSubscriptionId`.
 * PayPal's cancel is effective at the *end* of the period already paid for, and
 * the webhook handler treats `BILLING.SUBSCRIPTION.CANCELLED` as a deliberate
 * no-op for exactly this reason (`planForEvent` in lib/paypalWebhook.ts).
 * Downgrading here would revoke access the customer has paid for and would
 * contradict the page copy that tells them when it runs out. `EXPIRED` is the
 * event that carries the downgrade, and it arrives on its own.
 *
 * Clearing the id would be worse than a no-op: the expiration guard compares the
 * user's stored id to the one in the event, so a cleared column makes the real
 * `EXPIRED` event look stale and skip the downgrade entirely — leaving the
 * account on PRO forever. It also strips the reconciliation sweep of the id it
 * needs to check the subscription.
 */
export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, paypalSubscriptionId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (normalizePlan(user.plan) !== "PRO") {
    return NextResponse.json(
      { error: "This account is not on the Pro plan." },
      { status: 409 },
    );
  }

  const subscriptionId = user.paypalSubscriptionId;

  if (!subscriptionId) {
    // Paid access with no subscription on file — usually a lost activation
    // webhook or a hand-granted plan. PayPal has nothing to cancel, so this is
    // not actionable here. The reconciliation sweep is the route that reports it.
    return NextResponse.json(
      {
        error:
          "No PayPal subscription is on file for this account. Contact support if you believe this is wrong.",
      },
      { status: 409 },
    );
  }

  // Read the status before cancelling so an already-cancelled subscription is
  // reported as done instead of surfacing PayPal's 422 as a failure.
  let status: string | null = null;

  try {
    status = (await getSubscription(subscriptionId)).status;
  } catch (error) {
    console.error("[cancel] could not read subscription status:", error);

    if (error instanceof PayPalError && error.status === 404) {
      return NextResponse.json(
        {
          error:
            "PayPal no longer has this subscription. Contact support so we can reconcile your account.",
        },
        { status: 409 },
      );
    }

    // Unreachable is not the same as cancelled. Stopping here keeps the plan
    // untouched rather than guessing at a change we could not confirm.
    return NextResponse.json(
      { error: "Could not reach PayPal. Your plan is unchanged. Try again." },
      { status: 502 },
    );
  }

  if (status === "CANCELLED") {
    return NextResponse.json({
      cancelled: true,
      alreadyCancelled: true,
      message: "This subscription was already cancelled.",
    });
  }

  if (status === "EXPIRED") {
    return NextResponse.json({
      cancelled: true,
      alreadyExpired: true,
      message:
        "This subscription has already expired. It will not renew, and no further payments will be taken.",
    });
  }

  try {
    await cancelSubscription(
      subscriptionId,
      "Cancelled by the user from the Ameelai subscription dashboard.",
    );
  } catch (error) {
    console.error("[cancel] PayPal refused the cancellation:", error);

    return NextResponse.json(
      {
        error: "PayPal could not cancel the subscription. Nothing has changed.",
        details:
          error instanceof PayPalError
            ? (error.details ?? null)
            : error instanceof Error
              ? error.message
              : String(error),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    cancelled: true,
    // Surfaced so the UI can tell the customer when access actually ends
    // instead of implying their Pro features vanished on click.
    accessRetained: true,
    message:
      "Your subscription is cancelled. You keep Pro access until the end of the period you have already paid for, and it will not renew.",
  });
}