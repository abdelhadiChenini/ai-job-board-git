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
 * quietly undid the early-access gate: a Free user who reached the same job via
 * a "View opportunity" link got the external application page with the paywall
 * never consulted. The gate is only as strong as its least-guarded exit.
 *
 * Signed-in users are therefore held to the same entitlement rules as the Apply
 * button, resolved from the same helpers. Anonymous visitors are still allowed
 * through on purpose â€” they have no plan to gate, and the opportunity page
 * offers signed-out visitors a direct link by design.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "Invalid or missing job id" },
      { status: 400 },
    );
  }

  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    const [user, job] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true, role: true },
      }),
      prisma.jobOffer.findUnique({
        where: { id },
        select: { affiliateUrl: true, datePosted: true, createdAt: true },
      }),
    ]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (
      !bypassesApplyLimits(user) &&
      Date.now() < getEarlyAccessUnlockAt(job).getTime()
    ) {
      return NextResponse.json(
        { error: EARLY_ACCESS_FORBIDDEN_MESSAGE },
        { status: 403 },
      );
    }

    return redirectToAffiliate(job.affiliateUrl);
  }

  const job = await prisma.jobOffer.findUnique({
    where: { id },
    select: { affiliateUrl: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return redirectToAffiliate(job.affiliateUrl);
}

function redirectToAffiliate(affiliateUrl: string): NextResponse {
  const url = new URL(affiliateUrl);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return NextResponse.json(
      { error: "Invalid destination URL" },
      { status: 400 },
    );
  }

  return NextResponse.redirect(affiliateUrl, 301);
}
