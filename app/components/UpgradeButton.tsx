"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { Sparkles } from "lucide-react";

/**
 * PayPal checkout for the Pro upgrade.
 *
 * The subscription is created by *our* server, not by
 * `actions.subscription.create({ plan_id })`. That call would create the
 * subscription inside the browser with no `custom_id`, and our webhook
 * identifies the buyer by `resource.custom_id` — so a subscription created that
 * way could never be credited to anyone. The customer would pay and stay on the
 * free plan. Creating it server-side keeps the user binding, and the plan itself
 * is still only ever granted by a verified webhook.
 *
 * `vault: true` is required, not cosmetic. PayPal's script configuration docs
 * state that `intent=subscription` is "used along with `vault=true`", and every
 * official subscription sample pairs them. Without it the SDK treats the load as
 * a one-off payment flow, filters the funding sources down to ones that cannot be
 * saved, and the script itself 400s — so no buttons render at all.
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

// The approval webhook is not instantaneous, and it usually lands *after*
// `onApprove` fires. Refreshing straight away would re-render the paywall
// unchanged and tell the customer they paid for nothing, so refresh on a
// widening schedule until the webhook catches up.
const REFRESH_SCHEDULE_MS = [1_500, 3_000, 6_000, 10_000, 20_000];

type CreateResponse = { id?: string; error?: string };

export default function UpgradeButton() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timers = REFRESH_SCHEDULE_MS.map((delay) =>
      setTimeout(() => router.refresh(), delay),
    );

    return () => timers.forEach(clearTimeout);
  }, [notice, router]);

  const createSubscription = useCallback(async (): Promise<string> => {
    const here = `${window.location.pathname}${window.location.search}`;

    const response = await fetch("/api/paypal/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnPath: here, cancelPath: here }),
    });

    const data = (await response.json()) as CreateResponse;

    if (!response.ok || !data.id) {
      throw new Error(data.error ?? "Could not start checkout.");
    }

    // Handing PayPal a server-created id is what lets the SDK render its own
    // approval modal for a subscription that carries our custom_id.
    return data.id;
  }, []);

  const onApprove = useCallback(async () => {
    setError(null);
    setNotice("Subscription successful! Upgrading your account...");
  }, []);

  const onError = useCallback(() => {
    setNotice(null);
    setError("PayPal could not complete the checkout. Please try again.");
  }, []);

  const onCancel = useCallback(() => {
    setError(null);
  }, []);

  if (!CLIENT_ID) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-3 font-semibold text-slate-400"
        >
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          Upgrade to Pro
        </button>
        <p role="alert" className="text-center text-xs text-amber-300">
          Checkout is not configured yet. Please try again soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <PayPalScriptProvider
        options={{
          clientId: CLIENT_ID,
          vault: true,
          intent: "subscription",
          currency: "USD",
        }}
      >
        <PayPalButtons
          style={{
            layout: "vertical",
            shape: "rect",
            label: "paypal",
            height: 48,
          }}
          createSubscription={createSubscription}
          onApprove={onApprove}
          onError={onError}
          onCancel={onCancel}
        />
      </PayPalScriptProvider>

      {notice && (
        <p role="status" className="text-center text-xs text-emerald-300">
          {notice}
        </p>
      )}

      {error && (
        <p role="alert" className="text-center text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
