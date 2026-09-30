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

  let body: { returnUrl?: unknown; cancelUrl?: unknown } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (typeof body.returnUrl !== "string" || typeof body.cancelUrl !== "string") {
    return NextResponse.json(
      { error: "returnUrl and cancelUrl are required." },
      { status: 400 },
    );
  }

  try {
    const subscription = await createSubscription({
      planId,
      customId: session.user.id,
      returnUrl: body.returnUrl,
      cancelUrl: body.cancelUrl,
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
      return NextResponse.json(
        { error: "Could not start the PayPal subscription. Try again." },
        { status: error.status === 500 ? 503 : 502 },
      );
    }

    return NextResponse.json(
      { error: "Could not start the PayPal subscription. Try again." },
      { status: 502 },
    );
  }
}
