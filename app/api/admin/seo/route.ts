import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

const SEOT_ID = "global";

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized." },
  { status: 401 },
);

function strOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function GET() {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  let settings = await prisma.seoSetting.findUnique({ where: { id: SEOT_ID } });
  if (!settings) {
    settings = await prisma.seoSetting.create({ data: { id: SEOT_ID } });
  }

  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  const settings = await prisma.seoSetting.upsert({
    where: { id: SEOT_ID },
    create: {
      id: SEOT_ID,
      siteTitle: strOrNull(b.siteTitle),
      metaDescription: strOrNull(b.metaDescription),
      keywords: strOrNull(b.keywords),
      logoUrl: strOrNull(b.logoUrl),
      headerInjection: strOrNull(b.headerInjection),
      bodyInjection: strOrNull(b.bodyInjection),
      footerInjection: strOrNull(b.footerInjection),
      linkedinUrl: strOrNull(b.linkedinUrl),
      twitterUrl: strOrNull(b.twitterUrl),
      instagramUrl: strOrNull(b.instagramUrl),
      youtubeUrl: strOrNull(b.youtubeUrl),
    },
    update: {
      siteTitle: strOrNull(b.siteTitle),
      metaDescription: strOrNull(b.metaDescription),
      keywords: strOrNull(b.keywords),
      logoUrl: strOrNull(b.logoUrl),
      headerInjection: strOrNull(b.headerInjection),
      bodyInjection: strOrNull(b.bodyInjection),
      footerInjection: strOrNull(b.footerInjection),
      linkedinUrl: strOrNull(b.linkedinUrl),
      twitterUrl: strOrNull(b.twitterUrl),
      instagramUrl: strOrNull(b.instagramUrl),
      youtubeUrl: strOrNull(b.youtubeUrl),
    },
  });

  return NextResponse.json(settings);
}