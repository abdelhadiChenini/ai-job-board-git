import { NextResponse } from "next/server";
import { applyPlanChange } from "@/lib/subscription";
import {
  readWebhookHeaders,
  verifyWebhookSignature,
} from "@/lib/paypal";

export const dynamic = "force-dynamic";

type PayPalEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    custom_id?: string;
    status?: string;
  };
};

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
      return "PRO";
    case "BILLING.SUBSCRIPTION.EXPIRED":
      return "FREE";
    case "BILLING.SUBSCRIPTION.CANCELLED":
      return null;
    default:
      return null;
  }
}

export async function POST(request: Request) {
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

  const userId = event.resource?.custom_id;

  if (!userId) {
    return NextResponse.json(
      { error: "Event is missing custom_id." },
      { status: 422 },
    );
  }

  const expiring = eventType === "BILLING.SUBSCRIPTION.EXPIRED";

  try {
    const result = await applyPlanChange({
      userId,
      plan,
      changedBy: "webhook",
      // Activation records the new subscription, which supersedes any previous
      // one. Expiration instead clears the field, but only when the expiring
      // subscription is the one currently granting access.
      paypalSubscriptionId: expiring ? null : (event.resource?.id ?? null),
      ...(expiring ? { requireSubscriptionId: event.resource?.id ?? null } : {}),
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
