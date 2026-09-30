import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { applyPlanChange } from "@/lib/subscription";
import { ACTIVE_SUBSCRIPTION_STATUSES, PayPalError, getSubscription } from "@/lib/paypal";

// One PayPal request per PRO user, so this must stay bounded. Cap the batch and
// run sequentially: the default concurrency here would trip PayPal's rate
// limits well before the database ran out of users.
const MAX_BATCH = 100;
const DEFAULT_BATCH = 25;
const MAX_REPORTED_REVOKED = 50;

const UNAUTHORIZED = NextResponse.json({ error: "Unauthorized." }, { status: 401 });

/**
 * Constant-time secret comparison.
 *
 * A plain `===` returns as soon as it finds a differing byte, which leaks the
 * secret's prefix through response timing. `timingSafeEqual` compares in
 * fixed time instead. The length check has to come first because that function
 * throws on a length mismatch.
 */
function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

/**
 * Two ways in:
 *
 * - `Authorization: Bearer <RECONCILIATION_SECRET>`, used by the scheduled
 *   GitHub Actions job, which has no session.
 * - A valid admin session, so the sweep can be triggered by hand from the
 *   admin UI during an incident.
 *
 * An unset secret denies everyone rather than allowing everyone, so a deploy
 * that forgets the env var disables the cron instead of exposing the endpoint.
 */
function isAuthorized(request: Request): boolean {
  const expected = process.env.RECONCILIATION_SECRET;

  if (expected) {
    const bearer = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim();
    const direct = request.headers.get("x-reconciliation-secret")?.trim();

    if ((bearer && secretsMatch(bearer, expected)) || (direct && secretsMatch(direct, expected))) {
      return true;
    }
  }

  return false;
}

type Revoked = {
  userId: string;
  email: string;
  subscriptionId: string;
  paypalStatus: string;
};

type Skipped = {
  userId: string;
  email: string;
  subscriptionId: string | null;
  reason: string;
};

/**
 * Backstop for webhooks that never arrived.
 *
 * PayPal retries transient failures, but a webhook can still be lost for good
 * (endpoint disabled during a deploy, a prolonged outage, an event dropped
 * after the retry window). The result is a customer who paid, whose access was
 * revoked by nothing, and whose `plan` disagrees with PayPal. This walks the
 * PRO users and asks PayPal for the truth, downgrading only the ones whose
 * subscription has genuinely stopped entitling them.
 *
 * POST, not GET: it mutates plans and bills N PayPal calls, so it must not be
 * reachable by a link, a prefetch, or a crawler.
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  const secretConfigured = Boolean(process.env.RECONCILIATION_SECRET);

  if (!isAuthorized(request) && !session) {
    return UNAUTHORIZED;
  }

  const raw = new URL(request.url).searchParams.get("batch");
  const batch = Math.min(
    Math.max(Number(raw ?? DEFAULT_BATCH) || DEFAULT_BATCH, 1),
    MAX_BATCH,
  );

  const proUsers = await prisma.user.findMany({
    where: { plan: "PRO" },
    select: { id: true, email: true, paypalSubscriptionId: true },
    take: batch,
    orderBy: { updatedAt: "asc" },
  });

  const revoked: Revoked[] = [];
  const kept: { subscriptionId: string; paypalStatus: string }[] = [];
  const skipped: Skipped[] = [];

  for (const user of proUsers) {
    // A PRO user with no subscription is either granted by hand or lost an
    // activation webhook. PayPal cannot confirm or deny it, so report rather
    // than guess — downgrading here could revoke legitimately paid access.
    if (!user.paypalSubscriptionId) {
      skipped.push({
        userId: user.id,
        email: user.email,
        subscriptionId: null,
        reason: "No subscription id on file.",
      });
      continue;
    }

    const subscriptionId = user.paypalSubscriptionId;

    try {
      const subscription = await getSubscription(subscriptionId);

      if (ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
        kept.push({ subscriptionId, paypalStatus: subscription.status });
        continue;
      }

      // EXPIRED, or SUSPENDED after failed payment recovery.
      const result = await applyPlanChange({
        userId: user.id,
        plan: "FREE",
        changedBy: "reconcile",
        // Clear the id only when it is still the one that granted access, so a
        // concurrent re-subscribe is never clobbered by this run.
        paypalSubscriptionId: null,
        requireSubscriptionId: subscriptionId,
      });

      if (!result.ok) {
        skipped.push({
          userId: user.id,
          email: user.email,
          subscriptionId,
          reason: result.error,
        });
        continue;
      }

      if (result.skipReason === "subscription_mismatch") {
        skipped.push({
          userId: user.id,
          email: user.email,
          subscriptionId,
          reason: "Subscription changed while reconciling; left untouched.",
        });
        continue;
      }

      if (result.changed) {
        revoked.push({
          userId: user.id,
          email: user.email,
          subscriptionId,
          paypalStatus: subscription.status,
        });
      } else {
        kept.push({ subscriptionId, paypalStatus: subscription.status });
      }
    } catch (error) {
      // Failures are recorded and the walk continues: one dead subscription id
      // must not block the rest of the batch. A transient PayPal 5xx will be
      // picked up on the next run.
      skipped.push({
        userId: user.id,
        email: user.email,
        subscriptionId,
        reason:
          error instanceof PayPalError
            ? `PayPal request failed (${error.status}).`
            : "Unexpected error checking PayPal.",
      });
    }
  }

  return NextResponse.json({
    checked: proUsers.length,
    batch,
    // False means there may be more PRO users than this run covered; call
    // again with a larger batch to sweep the rest.
    complete: proUsers.length < batch,
    downgraded: revoked.length,
    kept: kept.length,
    skipped: skipped.length,
    revoked: revoked.slice(0, MAX_REPORTED_REVOKED),
    skippedDetails: skipped.slice(0, MAX_REPORTED_REVOKED),
    // Surfaces a misconfigured deploy: this run was authorised by session, and
    // the scheduled job would have been rejected.
    ...(secretConfigured ? {} : { warning: "RECONCILIATION_SECRET is not set." }),
  });
}
