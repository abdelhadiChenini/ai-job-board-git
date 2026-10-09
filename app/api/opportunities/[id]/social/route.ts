import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatSalary(
  currency: string,
  salaryMin: number | null,
  salaryMax: number | null,
): string {
  if (salaryMin == null && salaryMax == null) return "";
  const min = salaryMin == null ? "" : `${salaryMin}`;
  const max = salaryMax == null ? "" : `${salaryMax}`;
  return `${currency} ${min}${min && max ? " - " : ""}${max}`.trim();
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const opportunity = await prisma.jobOffer.findUnique({
    where: { id },
    include: { platform: { select: { name: true } } },
  });

  if (!opportunity) {
    return NextResponse.json(
      { error: "Opportunity not found." },
      { status: 404 },
    );
  }

  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "MAKE_WEBHOOK_URL is not configured." },
      { status: 500 },
    );
  }

  const payload = {
    title: opportunity.title,
    platform: opportunity.platform.name,
    salary: formatSalary(
      opportunity.currency,
      opportunity.salaryMin,
      opportunity.salaryMax,
    ),
    tags: Array.isArray(opportunity.tags) ? opportunity.tags : [],
    url: `https://ameelai.com/opportunities/${opportunity.slug}`,
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to trigger social sharing webhook." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
