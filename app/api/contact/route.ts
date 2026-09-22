import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/admin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 },
    );
  }
  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }
  if (!subject) {
    return NextResponse.json(
      { error: "Subject is required." },
      { status: 400 },
    );
  }
  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 },
    );
  }

  const contactMessage = await prisma.contactMessage.create({
    data: { name, email, subject, message },
  });

  return NextResponse.json(contactMessage, { status: 201 });
}