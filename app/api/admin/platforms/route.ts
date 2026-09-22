import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession, readJsonBody } from "@/lib/admin";

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized." },
  { status: 401 },
);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
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

  const platforms = await prisma.aIPlatform.findMany({
    take,
    skip,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { jobOffers: true } },
    },
  });

  return NextResponse.json(platforms);
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const websiteUrl = typeof body.websiteUrl === "string" ? body.websiteUrl : "";
  const description = typeof body.description === "string" ? body.description : "";
  const logoUrl = typeof body.logoUrl === "string" ? body.logoUrl : "";

  if (!name) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 },
    );
  }
  if (!slug || !isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Slug is required and must be lowercase alphanumeric with dashes." },
      { status: 400 },
    );
  }

  const existing = await prisma.aIPlatform.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "A platform with this slug already exists." },
      { status: 409 },
    );
  }

  const platform = await prisma.aIPlatform.create({
    data: { name, slug, websiteUrl, description, logoUrl },
  });

  return NextResponse.json(platform, { status: 201 });
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
      { error: "Platform id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.aIPlatform.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Platform not found." }, { status: 404 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : undefined;
  if (slug !== undefined && !isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase alphanumeric with dashes." },
      { status: 400 },
    );
  }
  if (slug) {
    const taken = await prisma.aIPlatform.findUnique({ where: { slug } });
    if (taken && taken.id !== id) {
      return NextResponse.json(
        { error: "A platform with this slug already exists." },
        { status: 409 },
      );
    }
  }

  const data: Prisma.AIPlatformUpdateInput = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (slug) data.slug = slug;
  if (typeof body.websiteUrl === "string") data.websiteUrl = body.websiteUrl;
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.logoUrl === "string") data.logoUrl = body.logoUrl;

  const platform = await prisma.aIPlatform.update({ where: { id }, data });

  return NextResponse.json(platform);
}

export async function DELETE(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Platform id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.aIPlatform.findUnique({
    where: { id },
    include: { _count: { select: { jobOffers: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Platform not found." }, { status: 404 });
  }

  if (existing._count.jobOffers > 0) {
    return NextResponse.json(
      {
        error:
          "This platform still has opportunities attached. Delete them first.",
      },
      { status: 409 },
    );
  }

  await prisma.aIPlatform.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}