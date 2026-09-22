import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseSkills(value: unknown): Prisma.InputJsonValue {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value as Prisma.InputJsonValue;
  }
  return [] as Prisma.InputJsonValue;
}

function strOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const profile = await prisma.expertProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ profile, email: session.user.email ?? null });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  if (typeof b.fullName !== "string" || !b.fullName.trim()) {
    return NextResponse.json(
      { error: "Full name is required." },
      { status: 400 },
    );
  }

  const fields = {
    fullName: b.fullName.trim(),
    headline: strOrNull(b.headline),
    country: strOrNull(b.country),
    stateRegion: strOrNull(b.stateRegion),
    bio: strOrNull(b.bio),
    areasOfExpertise: strOrNull(b.areasOfExpertise),
    languages: strOrNull(b.languages),
    yearsOfExperience: strOrNull(b.yearsOfExperience),
    availability: strOrNull(b.availability),
    workPreference: strOrNull(b.workPreference),
    hourlyRate: strOrNull(b.hourlyRate),
    education: strOrNull(b.education),
    certifications: strOrNull(b.certifications),
    linkedin: strOrNull(b.linkedin),
    xUrl: strOrNull(b.xUrl),
    github: strOrNull(b.github),
    youtube: strOrNull(b.youtube),
    website: strOrNull(b.website),
    phoneNumber: strOrNull(b.phoneNumber),
    profilePicture: strOrNull(b.profilePicture),
    skills: parseSkills(b.skills),
    isPublic: bool(b.isPublic, false),
    showEmail: bool(b.showEmail, false),
    showPhone: bool(b.showPhone, false),
    emailUpdates: bool(b.emailUpdates, true),
  };

  const profile = await prisma.expertProfile.upsert({
    where: { userId: session.user.id },
    create: { ...fields, userId: session.user.id },
    update: fields,
  });

  return NextResponse.json({ profile });
}