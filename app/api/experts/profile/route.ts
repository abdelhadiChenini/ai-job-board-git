import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const AVAILABLE_VALUES = ["Available for Work", "Not Looking"];

function parseSkills(value: unknown):
  | Prisma.InputJsonValue
  | null
  | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const skills = value
    .split(/[,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return skills as unknown as Prisma.InputJsonValue;
}

function strOrNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function hourlyRateValue(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return value.trim() ? (Number.isFinite(parsed) ? String(parsed) : value.trim()) : null;
  }
  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const profile = await prisma.expertProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      hourlyRate: true,
      skills: true,
      bio: true,
      availability: true,
    },
  });

  const skills = Array.isArray(profile?.skills)
    ? profile.skills.filter((item): item is string => typeof item === "string")
    : [];

  return NextResponse.json({
    profile: {
      hourlyRate: profile?.hourlyRate ?? "",
      skills,
      bio: profile?.bio ?? "",
      availability: profile?.availability ?? "Not Looking",
    },
  });
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

  const data: Prisma.ExpertProfileUncheckedUpdateInput = {};

  if ("hourlyRate" in b) {
    const value = hourlyRateValue(b.hourlyRate);
    if (value === undefined) {
      return NextResponse.json(
        { error: "hourlyRate must be a valid number." },
        { status: 400 },
      );
    }
    data.hourlyRate = value;
  }

  if ("skills" in b) {
    const skills = parseSkills(b.skills);
    if (skills === null) {
      return NextResponse.json(
        { error: "skills must be a comma-separated string." },
        { status: 400 },
      );
    }
    data.skills = skills;
  }

  if ("bio" in b) {
    data.bio = strOrNull(b.bio);
  }

  if ("availability" in b) {
    if (!AVAILABLE_VALUES.includes(String(b.availability))) {
      return NextResponse.json(
        { error: "availability must be 'Available for Work' or 'Not Looking'." },
        { status: 400 },
      );
    }
    data.availability = String(b.availability);
  }

  const profile = await prisma.expertProfile.upsert({
    where: { userId: session.user.id },
    create: {
      ...(data as Prisma.ExpertProfileUncheckedCreateInput),
      userId: session.user.id,
      fullName: session.user.email ?? "Expert",
    },
    update: data,
  });

  return NextResponse.json({ profile });
}