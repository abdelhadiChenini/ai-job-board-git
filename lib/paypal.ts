/**
 * Minimal PayPal REST client for Subscriptions.
 *
 * Secrets are only ever sent to PayPal over TLS and are never logged or
 * returned to the client â€” failures surface as generic errors.
 */

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";

export class PayPalError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PayPalError";
    this.status = status;
  }
}

export function getPayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const planId = process.env.PAYPAL_PLAN_ID;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  return { clientId, clientSecret, planId, webhookId };
}

/**
 * Defaults to sandbox. Production traffic requires an explicit
 * `PAYPAL_ENV=live`, so a half-configured deploy can never take live payments.
 */
export function getPayPalBaseUrl(): string {
  return process.env.PAYPAL_ENV === "live" ? LIVE_BASE : SANDBOX_BASE;
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getPayPalConfig();

  if (!clientId || !clientSecret) {
    throw new PayPalError("PayPal credentials are not configured.", 500);
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new PayPalError("Could not authenticate with PayPal.", 502);
  }

  const data = (await response.json()) as { access_token?: string };

  if (!data.access_token) {
    throw new PayPalError("PayPal returned an unexpected token response.", 502);
  }

  return data.access_token;
}

async function paypalFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(`${getPayPalBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new PayPalError("PayPal request failed.", response.status);
  }

  return (await response.json()) as T;
}

export type PayPalSubscription = {
  id: string;
  status: string;
  links?: { href: string; rel: string }[];
};

/**
 * Subscription facts the dashboard needs beyond status.
 *
 * `billing_info` is not returned by a default `GET`, so it has to be requested
 * explicitly. `next_billing_time` is the moment the current paid period ends,
 * which is the closest thing PayPal offers to an expiry date — an already
 * cancelled subscription has none, because access simply runs out.
 */
export type PayPalSubscriptionDetails = PayPalSubscription & {
  billing_info?: {
    next_billing_time?: string;
    last_payment_time?: string;
  };
};

export async function getSubscriptionDetails(
  subscriptionId: string,
): Promise<PayPalSubscriptionDetails> {
  return paypalFetch<PayPalSubscriptionDetails>(
    `/v1/billing/subscriptions/${encodeURIComponent(
      subscriptionId,
    )}?fields=status,billing_info`,
  );
}

/**
 * Statuses that mean the customer has (or still has) paid access. PayPal keeps
 * the `CANCELLED` subscription readable and entitled until the period already
 * paid for runs out, at which point it becomes `EXPIRED`. Only `EXPIRED` — plus
 * `SUSPENDED`, which PayPal applies after failed payment recovery — means the
 * paid access is really gone.
 */
export const ACTIVE_SUBSCRIPTION_STATUSES: ReadonlySet<string> = new Set([
  "ACTIVE",
  "APPROVAL_PENDING",
  "CANCELLED",
]);

export async function getSubscription(
  subscriptionId: string,
): Promise<PayPalSubscription> {
  return paypalFetch<PayPalSubscription>(
    `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
}

export async function createSubscription(params: {
  planId: string;
  customId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PayPalSubscription> {
  return paypalFetch<PayPalSubscription>("/v1/billing/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: params.planId,
      custom_id: params.customId,
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });
}

export type PayPalWebhookHeaders = {
  authAlgo: string | null;
  certUrl: string | null;
  transmissionId: string | null;
  transmissionSig: string | null;
  transmissionTime: string | null;
};

export function readWebhookHeaders(headers: Headers): PayPalWebhookHeaders {
  return {
    authAlgo: headers.get("paypal-auth-algo"),
    certUrl: headers.get("paypal-cert-url"),
    transmissionId: headers.get("paypal-transmission-id"),
    transmissionSig: headers.get("paypal-transmission-sig"),
    transmissionTime: headers.get("paypal-transmission-time"),
  };
}

/**
 * Confirms the event really came from PayPal. Callers must not act on an event
 * until this resolves true â€” the request headers are trivially forgeable.
 */
export async function verifyWebhookSignature(
  headers: PayPalWebhookHeaders,
  webhookEvent: unknown,
): Promise<boolean> {
  const { webhookId } = getPayPalConfig();

  if (
    !webhookId ||
    !headers.authAlgo ||
    !headers.certUrl ||
    !headers.transmissionId ||
    !headers.transmissionSig ||
    !headers.transmissionTime
  ) {
    return false;
  }

  try {
    const result = await paypalFetch<{ verification_status?: string }>(
      "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        body: JSON.stringify({
          auth_algo: headers.authAlgo,
          cert_url: headers.certUrl,
          transmission_id: headers.transmissionId,
          transmission_sig: headers.transmissionSig,
          transmission_time: headers.transmissionTime,
          webhook_id: webhookId,
          webhook_event: webhookEvent,
        }),
      },
    );

    return result.verification_status === "SUCCESS";
  } catch {
    return false;
  }
}
