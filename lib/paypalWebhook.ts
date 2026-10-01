import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyPlanChange } from "@/lib/subscription";
import { readWebhookHeaders, verifyWebhookSignature } from "@/lib/paypal";

/**
 * PayPal webhook handling, shared by both mounted routes:
 *
 * - `app/api/paypal/webhook` — the URL configured on the PayPal dashboard.
 * - `app/api/webhooks/paypal` — the original path, kept live so an existing
 *   dashboard config does not silently start 404ing.
 *
 * Both mount points re-export `POST` from here, so there is exactly one
 * implementation and the two paths cannot drift apart.
 */

export type PayPalEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    custom_id?: string;
    status?: string;
    /**
     * Present on PAYMENT.SALE.* events, where `resource` is a sale rather than a
     * subscription. It is the id of the billing agreement the sale paid.
     */
    billing_agreement_id?: string;
  };
};

/** Events whose `resource` is the subscription itself. */
const SUBSCRIPTION_EVENTS = new Set([
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
]);

/**
 * Maps a subscription lifecycle event to a plan.
 *
 * `CANCELLED` deliberately does not downgrade. PayPal fires it the moment a user
 * cancels, but they keep paid access until the end of the period they already
 * paid for; `EXPIRED` is the correct downgrade trigger. Downgrading on cancel
 * would revoke access users paid for.
 */
function planForEvent(eventType: string): "FREE" | "PRO" | null {
  switch (eventType) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "PAYMENT.SALE.COMPLETED":
      return "PRO";
    case "BILLING.SUBSCRIPTION.EXPIRED":
      return "FREE";
    case "BILLING.SUBSCRIPTION.CANCELLED":
      return null;
    default:
      return null;
  }
}

/**
 * The subscription id to store, or `undefined` to leave the stored one alone.
 *
 * On a subscription event `resource.id` *is* the subscription. On a
 * PAYMENT.SALE.* event `resource.id` is the sale id — storing that would put a
 * value PayPal's subscriptions API rejects into `paypalSubscriptionId`, which
 * then breaks every later status read and the reconciliation sweep. The
 * agreement id is the correct value there, and when PayPal omits it we leave the
 * column untouched rather than guessing.
 */
function subscriptionIdFor(event: PayPalEvent): string | undefined {
  const eventType = event.event_type ?? "";

  if (SUBSCRIPTION_EVENTS.has(eventType)) {
    return event.resource?.id;
  }

  return event.resource?.billing_agreement_id;
}

/**
 * Resolves the user an event refers to.
 *
 * `custom_id` is set on subscription creation, so it is the primary key for this
 * event type. SALE events do not always echo it, so the stored subscription id
 * is the fallback — which also covers the case where a sale arrives for a
 * subscription whose activation webhook was lost.
 */
async function resolveUserId(
  event: PayPalEvent,
): Promise<string | null> {
  const customId = event.resource?.custom_id;
  if (customId) return customId;

  const agreementId = event.resource?.billing_agreement_id;
  if (!agreementId) return null;

  const user = await prisma.user.findFirst({
    where: { paypalSubscriptionId: agreementId },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function handlePayPalWebhook(request: Request) {
  // PayPal signs the exact bytes it sent, so verification needs the raw body —
  // parse it once and reuse the parsed value for both steps.
  const rawBody = await request.text();

  let event: PayPalEvent;

  try {
    event = JSON.parse(rawBody) as PayPalEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const verified = await verifyWebhookSignature(
    readWebhookHeaders(request.headers),
    event,
  );

  if (!verified) {
    return NextResponse.json(
      { error: "Signature verification failed." },
      { status: 401 },
    );
  }

  const eventType = event.event_type ?? "";
  const plan = planForEvent(eventType);

  // Unhandled events still get a 200 so PayPal stops retrying them.
  if (plan === null) {
    return NextResponse.json({ received: true, handled: false });
  }

  const userId = await resolveUserId(event);

  if (!userId) {
    return NextResponse.json(
      { error: "Event is missing custom_id." },
      { status: 422 },
    );
  }

  const expiring = eventType === "BILLING.SUBSCRIPTION.EXPIRED";
  const subscriptionId = subscriptionIdFor(event);

  try {
    const result = await applyPlanChange({
      userId,
      plan,
      changedBy: "webhook",
      // Activation records the new subscription, which supersedes any previous
      // one. Expiration instead clears the field, but only when the expiring
      // subscription is the one currently granting access. A SALE event with no
      // usable subscription id passes `undefined`, leaving the column as it is.
      // `undefined` leaves the column untouched; see `subscriptionIdFor`.
      paypalSubscriptionId: expiring ? null : subscriptionId,
      ...(expiring ? { requireSubscriptionId: subscriptionId ?? null } : {}),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    // A stale expiration for a replaced subscription is not an error: the user
    // still holds the newer one, so acknowledge with 200 and make no change.
    if (result.skipReason === "subscription_mismatch") {
      return NextResponse.json({
        received: true,
        handled: true,
        changed: false,
        reason: result.skipReason,
      });
    }

    return NextResponse.json({ received: true, handled: true, changed: result.changed });
  } catch {
    // 500 makes PayPal redeliver, which is what we want for a transient fault.
    return NextResponse.json({ error: "Could not apply the change." }, { status: 500 });
  }
}