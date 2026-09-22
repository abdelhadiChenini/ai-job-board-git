import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession, readJsonBody } from "@/lib/admin";

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized." },
  { status: 401 },
);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

async function uniqueSlug(base: string): Promise<string> {
  if (!base) {
    base = slugify(`page-${Date.now().toString(36)}`);
  }
  let slug = base;
  let suffix = 1;
  while (await prisma.page.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function GET() {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const pages = await prisma.page.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pages);
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
  const content = typeof body.content === "string" ? body.content : "";
  const requestedSlug =
    typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";

  if (!title) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 },
    );
  }
  if (requestedSlug && !isValidSlug(requestedSlug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase alphanumeric with dashes." },
      { status: 400 },
    );
  }
  if (requestedSlug) {
    const taken = await prisma.page.findUnique({ where: { slug: requestedSlug } });
    if (taken) {
      return NextResponse.json(
        { error: "A page with this slug already exists." },
        { status: 409 },
      );
    }
  }

  const slug = requestedSlug || slugify(title);

  const page = await prisma.page.create({
    data: {
      title,
      slug: await uniqueSlug(slug),
      content,
    },
  });

  return NextResponse.json(page, { status: 201 });
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
      { error: "Page id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (typeof body.title === "string" && !title) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 },
    );
  }

  const data: Prisma.PageUpdateInput = {};
  if (title) data.title = title;
  if (typeof body.content === "string") data.content = body.content;

  if (typeof body.slug === "string" && body.slug.trim()) {
    const slug = body.slug.trim().toLowerCase();
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: "Slug must be lowercase alphanumeric with dashes." },
        { status: 400 },
      );
    }
    const taken = await prisma.page.findUnique({ where: { slug } });
    if (taken && taken.id !== id) {
      return NextResponse.json(
        { error: "A page with this slug already exists." },
        { status: 409 },
      );
    }
    data.slug = slug;
  }

  const page = await prisma.page.update({ where: { id }, data });

  return NextResponse.json(page);
}

export async function DELETE(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Page id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  await prisma.page.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}