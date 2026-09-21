import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    select: { affiliateUrl: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const url = new URL(job.affiliateUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return NextResponse.json(
      { error: "Invalid destination URL" },
      { status: 400 },
    );
  }

  return NextResponse.redirect(job.affiliateUrl, 301);
}