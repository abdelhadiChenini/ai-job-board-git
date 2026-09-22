import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession, readJsonBody } from "@/lib/admin";

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized." },
  { status: 401 },
);

function parsePublishedAt(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
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
  const published = searchParams.get("published");

  const blogPosts = await prisma.blogPost.findMany({
    take,
    skip,
    where: published === "true" || published === "false"
      ? { published: published === "true" }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, email: true, role: true } },
    },
  });

  return NextResponse.json(blogPosts);
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

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  const featuredImage =
    typeof body.featuredImage === "string" ? body.featuredImage : null;
  const authorId = typeof body.authorId === "string" ? body.authorId : "";
  const metaDescription =
    typeof body.metaDescription === "string" ? body.metaDescription : "";
  const excerpt = typeof body.excerpt === "string" ? body.excerpt : "";
  const published = typeof body.published === "boolean" ? body.published : false;
  const publishedAt = parsePublishedAt(body.publishedAt);
  if (publishedAt === undefined) {
    return NextResponse.json(
      { error: "publishedAt must be a valid date." },
      { status: 400 },
    );
  }

  if (!slug || !title || !content || !authorId) {
    return NextResponse.json(
      { error: "slug, title, content and authorId are required." },
      { status: 400 },
    );
  }

  const author = await prisma.user.findUnique({ where: { id: authorId } });
  if (!author) {
    return NextResponse.json({ error: "Author not found." }, { status: 404 });
  }

  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "A post with this slug already exists." },
      { status: 409 },
    );
  }

  const blogPost = await prisma.blogPost.create({
    data: {
      slug,
      title,
      content,
      featuredImage,
      authorId,
      metaDescription,
      excerpt,
      published,
      publishedAt,
    },
    include: {
      author: { select: { id: true, email: true, role: true } },
    },
  });

  return NextResponse.json(blogPost, { status: 201 });
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
    return NextResponse.json({ error: "Blog post id is required." }, { status: 400 });
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Blog post not found." }, { status: 404 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : undefined;
  if (slug) {
    const taken = await prisma.blogPost.findUnique({ where: { slug } });
    if (taken && taken.id !== id) {
      return NextResponse.json(
        { error: "A post with this slug already exists." },
        { status: 409 },
      );
    }
  }

  const authorId = typeof body.authorId === "string" ? body.authorId : undefined;
  if (authorId) {
    const author = await prisma.user.findUnique({ where: { id: authorId } });
    if (!author) {
      return NextResponse.json({ error: "Author not found." }, { status: 404 });
    }
  }

  const publishedAt = parsePublishedAt(body.publishedAt);
  if (publishedAt === undefined) {
    return NextResponse.json(
      { error: "publishedAt must be a valid date." },
      { status: 400 },
    );
  }

  const data: Prisma.BlogPostUpdateInput = {};
  if (slug) data.slug = slug;
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.featuredImage === "string") {
    data.featuredImage = body.featuredImage;
  }
  if (typeof body.metaDescription === "string") {
    data.metaDescription = body.metaDescription;
  }
  if (typeof body.excerpt === "string") data.excerpt = body.excerpt;
  if (typeof body.published === "boolean") data.published = body.published;
  if (publishedAt === null) data.publishedAt = { set: null };
  else if (publishedAt !== undefined) data.publishedAt = publishedAt;
  if (authorId) data.author = { connect: { id: authorId } };

  const blogPost = await prisma.blogPost.update({
    where: { id },
    data,
    include: {
      author: { select: { id: true, email: true, role: true } },
    },
  });

  return NextResponse.json(blogPost);
}

export async function DELETE(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Blog post id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Blog post not found." }, { status: 404 });
  }

  await prisma.blogPost.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}