import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";
import {
  createSubscription,
  getPayPalConfig,
  PayPalError,
} from "@/lib/paypal";

export const dynamic = "force-dynamic";

/**
 * Resolves a client-supplied path against the configured site origin.
 *
 * Only same-site paths are accepted. Passing the URL through unvalidated would
 * let a signed-in user mint a PayPal approval link that bounces the customer to
 * a site of their choosing — an open redirect on a payment flow, which is a
 * convincing phishing primitive. Requiring a leading `/` and rejecting `//`
 * closes both the absolute-URL and protocol-relative forms.
 */
function resolveSiteUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  return base || null;
}

function absoluteUrl(base: string, path: unknown): string | null {
  if (typeof path !== "string") {
    return null;
  }

  const trimmed = path.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  return `${base}${trimmed}`;
}

/**
 * Starts a PayPal subscription and returns the id plus the approval URL.
 *
 * The plan is NOT upgraded here. Only a verified `BILLING.SUBSCRIPTION.ACTIVATED`
 * webhook may change a user's plan, so a client that abandons approval (or fakes
 * the response) never receives paid access. The user's id travels to PayPal as
 * `custom_id` so the webhook knows who to credit.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 },
    );
  }

  const { planId } = getPayPalConfig();

  if (!planId) {
    return NextResponse.json(
      { error: "PayPal is not configured on this server." },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (normalizePlan(user.plan) === "PRO") {
    return NextResponse.json(
      { error: "This account is already on the Pro plan." },
      { status: 409 },
    );
  }

  let body: { returnPath?: unknown; cancelPath?: unknown } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const siteUrl = resolveSiteUrl();

  if (!siteUrl) {
    return NextResponse.json(
      { error: "PayPal is not configured on this server." },
      { status: 503 },
    );
  }

  const returnUrl = absoluteUrl(siteUrl, body.returnPath);
  const cancelUrl = absoluteUrl(siteUrl, body.cancelPath);

  if (!returnUrl || !cancelUrl) {
    return NextResponse.json(
      { error: "returnPath and cancelPath must be same-site paths." },
      { status: 400 },
    );
  }

  try {
    const subscription = await createSubscription({
      planId,
      customId: session.user.id,
      returnUrl,
      cancelUrl,
    });

    const approveUrl =
      subscription.links?.find((link) => link.rel === "approve")?.href ?? null;

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      approveUrl,
    });
  } catch (error) {
    if (error instanceof PayPalError) {
      // `details` is PayPal's own body, surfaced so the upstream failure can be
      // read from a browser console instead of an SSH session. The `error` copy
      // stays user-facing and generic; only the diagnostic field is raw. The
      // caller is already authenticated (see the session guard above).
      return NextResponse.json(
        {
          error: "Could not start the PayPal subscription. Try again.",
          details: error.details ?? null,
        },
        { status: error.status === 500 ? 503 : 502 },
      );
    }

    // A request that never reached PayPal — DNS, TLS, or blocked egress — throws
    // a TypeError rather than a PayPalError, so there is no body to read. Its
    // message is the only clue that the host cannot reach the live API at all,
    // which is a different fault entirely from bad credentials and was
    // previously indistinguishable from them.
    return NextResponse.json(
      {
        error: "Could not start the PayPal subscription. Try again.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
