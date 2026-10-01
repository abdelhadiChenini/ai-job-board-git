"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CancelResponse = {
  cancelled?: boolean;
  alreadyCancelled?: boolean;
  alreadyExpired?: boolean;
  message?: string;
  error?: string;
};

/**
 * Cancels the signed-in user's PayPal subscription.
 *
 * The button only appears while PayPal reports the subscription as still
 * live — an already-cancelled one has nothing left to cancel, and PayPal
 * rejects a second attempt with a 422 that would read as a failure.
 */
export default function CancelSubscriptionButton() {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your Pro subscription? You will keep Pro access until the end of the period you have already paid for, and it will not renew.",
    );

    if (!confirmed) return;

    setIsCancelling(true);
    setError(null);

    try {
      const response = await fetch("/api/paypal/cancel", { method: "POST" });

      // Read as text first: a proxy or host-level error page can answer with
      // HTML, and response.json() would throw on it and lose the only evidence.
      const raw = await response.text();
      let data: CancelResponse | null = null;

      try {
        data = JSON.parse(raw) as CancelResponse;
      } catch {
        console.error(
          `[cancel] answered ${response.status} with a non-JSON body:`,
          raw,
        );
      }

      if (!response.ok || !data?.cancelled) {
        setError(data?.error ?? "Could not cancel the subscription.");
        return;
      }

      // Re-render from the server so the plan card reflects PayPal's new
      // CANCELLED status rather than a locally patched one.
      router.refresh();
    } catch {
      setError("Network error while cancelling. Nothing has changed.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isCancelling}
        className="w-full rounded-xl border border-red-500/50 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition-colors hover:bg-red-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCancelling ? "Cancelling…" : "Cancel subscription"}
      </button>

      <p className="mt-3 text-center text-xs text-slate-500">
        Cancelling stops future renewals. You keep Pro access until the end of
        the period you have already paid for.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-center text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}