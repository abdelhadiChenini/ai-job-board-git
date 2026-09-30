/**
 * Intercepts the three PayPal endpoints these tests exercise, so the real
 * `lib/paypal.ts` code (OAuth, signature verification, subscription lookup)
 * runs end to end without a network call or credentials.
 */

export type SubscriptionLookup = Record<string, string | Error>;

export type PayPalMock = {
  /** Verification outcome for the next signature check. */
  setVerification: (result: "SUCCESS" | "FAILURE") => void;
  /** Status string PayPal reports for a subscription id, or a thrown error. */
  setSubscription: (id: string, status: string | Error) => void;
  /** Calls captured per endpoint, for asserting request counts. */
  calls: { verify: number; subscriptions: string[] };
  restore: () => void;
};

const SIGNATURE_HEADERS = {
  "paypal-auth-algo": "SHA256withRSA",
  "paypal-cert-url": "https://api.sandbox.paypal.com/v1/notifications/certs/TEST",
  "paypal-transmission-id": "transmission-test",
  "paypal-transmission-sig": "signature-test",
  "paypal-transmission-time": "2026-01-01T00:00:00Z",
};

export function signatureHeaders(): Record<string, string> {
  return { ...SIGNATURE_HEADERS };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function mockPayPal(): PayPalMock {
  const original = globalThis.fetch;

  let verification: "SUCCESS" | "FAILURE" = "SUCCESS";
  const subscriptions: SubscriptionLookup = {};
  const calls = { verify: 0, subscriptions: [] as string[] };

  globalThis.fetch = (async (input: unknown) => {
    const url = String(input);

    if (url.includes("/v1/oauth2/token")) {
      return json({ access_token: "test-access-token" });
    }

    if (url.includes("/v1/notifications/verify-webhook-signature")) {
      calls.verify += 1;
      return json({ verification_status: verification });
    }

    const match = url.match(/\/v1\/billing\/subscriptions\/([^/?]+)/);
    if (match) {
      const id = decodeURIComponent(match[1]);
      calls.subscriptions.push(id);
      const status = subscriptions[id];

      if (status === undefined) {
        return json({ name: "RESOURCE_NOT_FOUND" }, 404);
      }
      if (status instanceof Error) {
        return json({ name: "INTERNAL_SERVER_ERROR" }, status.message === "500" ? 500 : 503);
      }
      return json({ id, status });
    }

    throw new Error(`Unexpected request to ${url}`);
  }) as typeof fetch;

  return {
    setVerification: (result) => {
      verification = result;
    },
    setSubscription: (id, status) => {
      subscriptions[id] = status;
    },
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}
