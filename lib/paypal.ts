/**
 * Minimal PayPal REST client for Subscriptions.
 *
 * Secrets are only ever sent to PayPal over TLS and are never logged or
 * returned to the client — the client still receives a generic message. The one
 * exception is PayPal's *own* error body on an OAuth failure, which is written
 * to the server log: `invalid_client` versus `INVALID_REQUEST` versus a bare 502
 * is the only thing that separates a bad secret from a misrouted host, and
 * collapsing them into one generic 502 is what made the last two deploys
 * undiagnosable from the outside.
 */

const PAYPAL_BASE_URL = "https://api-m.paypal.com";

/**
 * `details` is PayPal's own response body, verbatim.
 *
 * It is the *upstream* error, never ours: the OAuth and billing error bodies
 * PayPal returns do not echo the client secret, and the one value they can echo
 * back is the plan id, which is already public in the client bundle. That makes
 * it safe to hand to a signed-in caller, and it is the difference between
 * diagnosing a checkout failure from a browser console and needing an SSH
 * session on the host. It is deliberately a raw string rather than parsed JSON:
 * a 502 from a proxy or a DNS-level failure in front of PayPal comes back as
 * HTML, and that HTML is the most diagnostic thing available.
 */
export class PayPalError extends Error {
  readonly status: number;
  readonly details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = "PayPalError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Environment variables have been named inconsistently across this project's
 * deployments — the local and Hostinger setups use `PAYPAL_SECRET` and
 * `NEXT_PUBLIC_PAYPAL_PLAN_ID`, while `.env.example` and the test config use
 * `PAYPAL_CLIENT_SECRET` and `PAYPAL_PLAN_ID`. Reading only one spelling meant a
 * correctly configured host still failed the `if (!planId)` guard in
 * `create-subscription` and answered checkout with a 503.
 *
 * Each value below therefore accepts both names. The canonical (documented) name
 * is preferred so `.env.example` stays authoritative, and the alternate is a
 * fallback rather than a replacement — this keeps the existing working
 * deployments working without a coordinated rename.
 *
 * `PAYPAL_SECRET` is a secret and stays server-only. The plan ID is not
 * sensitive (it appears in PayPal's own client-side samples), so reading
 * `NEXT_PUBLIC_PAYPAL_PLAN_ID` as a fallback is safe.
 */
function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];

    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return undefined;
}

export function getPayPalConfig() {
  const clientId = readEnv("PAYPAL_CLIENT_ID", "NEXT_PUBLIC_PAYPAL_CLIENT_ID");
  const clientSecret = readEnv("PAYPAL_CLIENT_SECRET", "PAYPAL_SECRET");
  const planId = readEnv("PAYPAL_PLAN_ID", "NEXT_PUBLIC_PAYPAL_PLAN_ID");
  const webhookId = readEnv("PAYPAL_WEBHOOK_ID");

  return { clientId, clientSecret, planId, webhookId };
}

/**
 * Pinned to the live API, with no sandbox fallback.
 *
 * This used to read `PAYPAL_ENV` and default to sandbox, on the reasoning that
 * a half-configured deploy should never take live payments. The cost was worse
 * than the risk it guarded: a deploy holding live credentials but no
 * `PAYPAL_ENV=live` sent them to `api-m.sandbox.paypal.com`, which rejects a
 * live client id with `401 invalid_client`, and that 401 was re-thrown as a 502.
 * The symptom was indistinguishable from a wrong secret, so the obvious fix
 * (rotating credentials) could never have worked.
 *
 * Routing is now explicit and unconditional. The consequence to be aware of:
 * this client can no longer reach the sandbox at all, so subscription flows
 * cannot be exercised end to end against sandbox credentials.
 */
export function getPayPalBaseUrl(): string {
  return PAYPAL_BASE_URL;
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getPayPalConfig();

  if (!clientId || !clientSecret) {
    throw new PayPalError("PayPal credentials are not configured.", 500);
  }

  // `.trim()` is applied again here, not just in `readEnv`, because this is the
  // only place the value becomes a credential. A trailing newline in a secret —
  // a very common artefact of pasting into a host's env var editor — produces
  // a syntactically valid but wrong Basic header, and PayPal answers that with
  // a plain 401. The invariant belongs next to the encoding.
  const credentials = Buffer.from(
    `${clientId.trim()}:${clientSecret.trim()}`,
  ).toString("base64");

  const tokenUrl = `${getPayPalBaseUrl()}/v1/oauth2/token`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    // Read once and reuse: a Response body can only be consumed a single time,
    // and this string is both the log line and the payload for the client.
    const body = await response.text();

    // PayPal's body is the diagnosis: it names `invalid_client` for a bad or
    // whitespace-padded secret, `invalid_request` for a malformed header, and
    // carries a `debug_id` support can trace. None of it contains the client id
    // or secret, so it is safe to log, and the client still gets a generic 502.
    console.error(
      `[paypal] OAuth token request to ${tokenUrl} failed: ${response.status} ${response.statusText} —`,
      body,
    );

    throw new PayPalError("Could not authenticate with PayPal.", 502, body);
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
    // Same reasoning as the OAuth failure: this is the branch that reports a
    // rejected subscription creation, and `RESOURCE_NOT_FOUND` /
    // `UNPROCESSABLE_ENTITY` on a plan id is exactly the diagnostic that was
    // previously swallowed into a bare 502.
    throw new PayPalError(
      "PayPal request failed.",
      response.status,
      await response.text(),
    );
  }

  return (await response.json()) as T;
}

export type PayPalSubscription = {
  id: string;
  status: string;
  links?: { href: string; rel: string }[];
};

/**
 * Cancels a subscription at PayPal, effective at the end of the paid period.
 *
 * Deliberately not routed through `paypalFetch`: a successful cancel answers
 * `204 No Content`, and `response.json()` throws on an empty body. That throw
 * would surface as a failed cancellation even though PayPal had already
 * processed it — the worst possible outcome, since the customer believes they
 * are still subscribed and the subscription has actually been cancelled.
 *
 * PayPal rejects an already-cancelled subscription with `422`, so callers should
 * read the current status first rather than treating a 422 here as a failure.
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason: string,
): Promise<void> {
  const token = await getAccessToken();

  const response = await fetch(
    `${getPayPalBaseUrl()}/v1/billing/subscriptions/${encodeURIComponent(
      subscriptionId,
    )}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new PayPalError(
      "PayPal could not cancel the subscription.",
      response.status,
      await response.text(),
    );
  }
}

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
