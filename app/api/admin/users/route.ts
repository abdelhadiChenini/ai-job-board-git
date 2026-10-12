import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession, readJsonBody } from "@/lib/admin";
import { calculateCompleteness } from "@/lib/completeness";

const ROLES = ["ADMIN", "EXPERT"] as const;
const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized." },
  { status: 401 },
);

const PROFILE_STATUSES = ["completed", "incomplete"] as const;
type ProfileStatus = (typeof PROFILE_STATUSES)[number];

/** Profile fields that decide whether an expert profile counts as complete. */
const COMPLETENESS_SELECT = {
  bio: true,
  skills: true,
  hourlyRate: true,
  country: true,
  stateRegion: true,
  languages: true,
  education: true,
} as const;

function parseProfileStatus(value: string | null): ProfileStatus | null {
  return typeof value === "string" &&
    (PROFILE_STATUSES as readonly string[]).includes(value)
    ? (value as ProfileStatus)
    : null;
}

type SafeUserInput = {
  id: string;
  email: string;
  role: string;
  plan: string;
  isFeatured: boolean;
  paypalSubscriptionId: string | null;
  expertProfile?: {
    verificationStatus: string;
    bio?: string | null;
    skills?: unknown;
    hourlyRate?: string | null;
    country?: string | null;
    stateRegion?: string | null;
    languages?: string | null;
    education?: string | null;
  } | null;
};

function toSafeUser(user: SafeUserInput) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    // `plan` is a free-form String column; normalise so the admin table only
    // ever receives a value its <select> can render.
    plan: user.plan === "PRO" ? "PRO" : "FREE",
    isFeatured: user.isFeatured,
    paypalSubscriptionId: user.paypalSubscriptionId,
    verificationStatus: user.expertProfile?.verificationStatus ?? null,
    // Shares the same rubric as the dashboard and analytics, so the filter and
    // the badge can never disagree about who is "complete".
    profileComplete: calculateCompleteness(user.expertProfile) === 100,
  };
}

/**
 * Ids of every account whose profile does (or does not) score 100 on the shared
 * completeness rubric. `calculateCompleteness` needs the raw profile fields, so
 * the narrowing happens in memory and feeds the `id: { in: [...] }` clause.
 */
async function userIdsByProfileStatus(status: ProfileStatus): Promise<string[]> {
  const rows = await prisma.user.findMany({
    select: {
      id: true,
      expertProfile: { select: COMPLETENESS_SELECT },
    },
  });

  return rows
    .filter((row) => {
      const complete = calculateCompleteness(row.expertProfile) === 100;
      return status === "completed" ? complete : !complete;
    })
    .map((row) => row.id);
}

export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const { searchParams } = request.nextUrl;
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? "20") || 20, 1),
    100,
  );
  const page = Math.max(Number(searchParams.get("page") ?? "1") || 1, 1);
  const skip = (page - 1) * limit;

  const profileStatus = parseProfileStatus(searchParams.get("profileStatus"));
  const where: Prisma.UserWhereInput =
    profileStatus === null
      ? {}
      : { id: { in: await userIdsByProfileStatus(profileStatus) } };

  const [totalCount, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        isFeatured: true,
        paypalSubscriptionId: true,
        createdAt: true,
        updatedAt: true,
        expertProfile: {
          select: { verificationStatus: true, ...COMPLETENESS_SELECT },
        },
      },
    }),
  ]);

  const users = rows.map((user) => ({
    ...toSafeUser(user),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return NextResponse.json({ users, totalCount, page, limit });
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

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = typeof body.role === "string" ? body.role : "EXPERT";

  if (!email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 },
    );
  }
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return NextResponse.json(
      { error: "Role must be ADMIN or EXPERT." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, hashedPassword, role: role as "ADMIN" | "EXPERT" },
  });

  return NextResponse.json(toSafeUser(user), { status: 201 });
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
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
  const password = typeof body.password === "string" ? body.password : undefined;
  const role = typeof body.role === "string" ? body.role : undefined;

  if (email && !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }
  if (role && !ROLES.includes(role as (typeof ROLES)[number])) {
    return NextResponse.json(
      { error: "Role must be ADMIN or EXPERT." },
      { status: 400 },
    );
  }
  if (email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken && taken.id !== id) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
  }

  const data: { email?: string; hashedPassword?: string; role?: "ADMIN" | "EXPERT" } = {};
  if (email) data.email = email;
  if (password && password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 },
    );
  }
  if (password) data.hashedPassword = await bcrypt.hash(password, 10);
  if (role) data.role = role as "ADMIN" | "EXPERT";

  const user = await prisma.user.update({ where: { id }, data });

  return NextResponse.json(toSafeUser(user));
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return UNAUTHORIZED;
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  if (session.user.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}