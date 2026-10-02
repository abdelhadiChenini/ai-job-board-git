import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  bypassesApplyLimits,
  EARLY_ACCESS_FORBIDDEN_MESSAGE,
  getEarlyAccessUnlockAt,
} from "@/lib/subscription";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Outbound hop to the employer's application page.
 *
 * This route used to forward anyone to `affiliateUrl` with no checks, which
 * quietly undid the early-access gate: reaching the same job through a "View
 * opportunity" link handed over the external application page with the paywall
 * never consulted. The gate is only as strong as its least-guarded exit, and
 * this is the exit.
 *
 * Entitlement is resolved the same way at every hop:
 *
 * - Pro members and admins forward straight through.
 * - Everyone else is held while the role is inside its early-access window.
 * - Anonymous visitors have no tier to test, so they are sent to log in rather
 *   than being waved through. Their real plan is what decides the outcome, and
 *   the window is a property of the opportunity, not of who is looking at it.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "Invalid or missing job id" },
      { status: 400 },
    );
  }

  const job = await prisma.jobOffer.findUnique({
    where: { id },
    select: { affiliateUrl: true, datePosted: true, createdAt: true, slug: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const locked = Date.now() < getEarlyAccessUnlockAt(job).getTime();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // A browser following a link cannot render a JSON error usefully, so this
    // sends the visitor somewhere they can act on instead of surfacing a bare
    // 403 body. Signing in re-enters the same gate with their real tier applied.
    if (locked) {
      const callbackUrl = job.slug ? `/opportunities/${job.slug}` : "/opportunities";

      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url),
        302,
      );
    }

    return redirectToAffiliate(job.affiliateUrl);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, role: true },
  });

  if (locked && !bypassesApplyLimits(user)) {
    return NextResponse.json(
      { error: EARLY_ACCESS_FORBIDDEN_MESSAGE },
      { status: 403 },
    );
  }

  return redirectToAffiliate(job.affiliateUrl);
}

function redirectToAffiliate(affiliateUrl: string): NextResponse {
  let url: URL;

  try {
    url = new URL(affiliateUrl);
  } catch {
    // `affiliateUrl` is operator-supplied, so it is not trustworthy enough to
    // assume it parses. `new URL` throws on a malformed value, and letting that
    // escape turned bad data into an opaque 500; a 400 names the actual fault.
    return NextResponse.json(
      { error: "Invalid destination URL" },
      { status: 400 },
    );
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return NextResponse.json(
      { error: "Invalid destination URL" },
      { status: 400 },
    );
  }

  return NextResponse.redirect(affiliateUrl, 301);
}
