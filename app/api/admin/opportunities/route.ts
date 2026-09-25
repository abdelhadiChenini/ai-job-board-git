import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession, readJsonBody } from "@/lib/admin";

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized." },
  { status: 401 },
);

function normalizeTags(tags: unknown): unknown[] | null {
  if (tags === undefined) return [];
  if (Array.isArray(tags)) return tags;
  return null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "opportunity";
  let slug = base;
  let suffix = 1;
  while (await prisma.jobOffer.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const { searchParams } = request.nextUrl;
  const platformId = searchParams.get("platformId") || undefined;

  const jobOffers = await prisma.jobOffer.findMany({
    where: platformId ? { platformId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      platform: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(jobOffers);
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const platformId = typeof body.platformId === "string" ? body.platformId : "";
  const aiLabName = typeof body.aiLabName === "string" ? body.aiLabName : "";
  const description = typeof body.description === "string" ? body.description : "";
  const affiliateUrl = typeof body.affiliateUrl === "string" ? body.affiliateUrl : "";
  const currency = typeof body.currency === "string" ? body.currency : "USD";
  const salaryMin = typeof body.salaryMin === "number" ? body.salaryMin : null;
  const salaryMax = typeof body.salaryMax === "number" ? body.salaryMax : null;
  const tags = normalizeTags(body.tags);
  const category = typeof body.category === "string" ? body.category : "";
  const region = typeof body.region === "string" ? body.region : "";
  const badge = typeof body.badge === "string" ? (body.badge || null) : null;

  if (tags === null) {
    return NextResponse.json(
      { error: "Tags must be an array." },
      { status: 400 },
    );
  }
  if (!title) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 },
    );
  }
  if (!platformId) {
    return NextResponse.json(
      { error: "platformId is required." },
      { status: 400 },
    );
  }

  const platform = await prisma.aIPlatform.findUnique({
    where: { id: platformId },
  });
  if (!platform) {
    return NextResponse.json(
      { error: "Platform not found." },
      { status: 404 },
    );
  }

  const jobOffer = await prisma.jobOffer.create({
    data: {
      title,
      slug: await uniqueSlug(title),
      platformId,
      aiLabName,
      description,
      affiliateUrl,
      currency,
      salaryMin,
      salaryMax,
      tags: tags as Prisma.InputJsonValue,
      datePosted:
        typeof body.datePosted === "string" && body.datePosted
          ? new Date(body.datePosted)
          : new Date(),
      jobLocationType:
        typeof body.jobLocationType === "string" && body.jobLocationType.trim()
          ? body.jobLocationType.trim()
          : "Remote",
      category,
      region,
      badge,
    },
    include: {
      platform: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(jobOffer, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json(
      { error: "Opportunity id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.jobOffer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
  }

  const platformId = typeof body.platformId === "string" ? body.platformId : undefined;
  if (platformId) {
    const platform = await prisma.aIPlatform.findUnique({
      where: { id: platformId },
    });
    if (!platform) {
      return NextResponse.json(
        { error: "Platform not found." },
        { status: 404 },
      );
    }
  }

  const tags = normalizeTags(body.tags);
  if (tags === null) {
    return NextResponse.json(
      { error: "Tags must be an array." },
      { status: 400 },
    );
  }

  const data: Prisma.JobOfferUpdateInput = {};
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (platformId) data.platform = { connect: { id: platformId } };
  if (typeof body.aiLabName === "string") data.aiLabName = body.aiLabName;
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.affiliateUrl === "string") data.affiliateUrl = body.affiliateUrl;
  if (typeof body.currency === "string") data.currency = body.currency;
  if (typeof body.salaryMin === "number" || body.salaryMin === null) {
    data.salaryMin = body.salaryMin;
  }
  if (typeof body.salaryMax === "number" || body.salaryMax === null) {
    data.salaryMax = body.salaryMax;
  }
  if (tags !== undefined) data.tags = tags as Prisma.InputJsonValue;
  if (typeof body.slug === "string" && body.slug.trim()) {
    const slug = slugify(body.slug);
    const taken = await prisma.jobOffer.findUnique({ where: { slug } });
    if (taken && taken.id !== id) {
      return NextResponse.json(
        { error: "An opportunity with this slug already exists." },
        { status: 409 },
      );
    }
    data.slug = slug;
  }
  if (typeof body.datePosted === "string" && body.datePosted) {
    data.datePosted = new Date(body.datePosted);
  }
  if (typeof body.jobLocationType === "string" && body.jobLocationType.trim()) {
    data.jobLocationType = body.jobLocationType.trim();
  }
  if (typeof body.category === "string") data.category = body.category;
  if (typeof body.region === "string") data.region = body.region;
  if (typeof body.badge === "string" || body.badge === null) {
    data.badge = body.badge || null;
  }

  const jobOffer = await prisma.jobOffer.update({
    where: { id },
    data,
    include: {
      platform: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(jobOffer);
}

export async function DELETE(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Opportunity id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.jobOffer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
  }

  await prisma.jobOffer.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}