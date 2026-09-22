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

export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const { searchParams } = request.nextUrl;
  const take = Math.min(
    Math.max(Number(searchParams.get("take") ?? "20") || 20, 1),
    100,
  );
  const skip = Math.max(Number(searchParams.get("skip") ?? "0") || 0, 0);
  const platformId = searchParams.get("platformId") || undefined;

  const jobOffers = await prisma.jobOffer.findMany({
    take,
    skip,
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
      platformId,
      aiLabName,
      description,
      affiliateUrl,
      currency,
      salaryMin,
      salaryMax,
      tags: tags as Prisma.InputJsonValue,
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