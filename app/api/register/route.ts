import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
  };

  if (
    typeof email !== "string" ||
    !email.includes("@") ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return NextResponse.json(
      { error: "Email and a password of at least 8 characters are required." },
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
    },
  });

  return NextResponse.json(
    { id: user.id, email: user.email, role: user.role },
    { status: 201 },
  );
}