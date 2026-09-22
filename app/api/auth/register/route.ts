import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function parseSkills(value: unknown): Prisma.InputJsonValue {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value as Prisma.InputJsonValue;
  }
  return [] as Prisma.InputJsonValue;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const {
    email,
    password,
    fullName,
    headline,
    country,
    skills,
    isPublic,
    profilePicture,
  } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
    fullName?: unknown;
    headline?: unknown;
    country?: unknown;
    skills?: unknown;
    isPublic?: unknown;
    profilePicture?: unknown;
  };

  if (
    typeof fullName !== "string" ||
    !fullName.trim()
  ) {
    return NextResponse.json(
      { error: "Full name is required." },
      { status: 400 },
    );
  }

  if (
    typeof email !== "string" ||
    !email.includes("@")
  ) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      hashedPassword,
      role: "EXPERT",
      expertProfile: {
        create: {
          fullName: fullName.trim(),
          headline: typeof headline === "string" ? headline.trim() : "",
          country: typeof country === "string" ? country.trim() : "",
          skills: parseSkills(skills),
          isPublic: typeof isPublic === "boolean" ? isPublic : false,
          profilePicture:
            typeof profilePicture === "string" && profilePicture.trim()
              ? profilePicture.trim()
              : null,
        },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      expertProfile: {
        select: {
          id: true,
          fullName: true,
          headline: true,
          country: true,
          skills: true,
          isPublic: true,
        },
      },
    },
  });

  return NextResponse.json(user, { status: 201 });
}