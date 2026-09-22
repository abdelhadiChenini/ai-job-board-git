import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, readJsonBody } from "@/lib/admin";

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized." },
  { status: 401 },
);

export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const { searchParams } = request.nextUrl;
  const take = Math.min(
    Math.max(Number(searchParams.get("take") ?? "50") || 50, 1),
    200,
  );
  const skip = Math.max(Number(searchParams.get("skip") ?? "0") || 0, 0);

  const messages = await prisma.contactMessage.findMany({
    take,
    skip,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(messages);
}

export async function PATCH(request: NextRequest) {
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
  const isRead = typeof body.isRead === "boolean" ? body.isRead : undefined;

  if (!id || isRead === undefined) {
    return NextResponse.json(
      { error: "Message id and isRead are required." },
      { status: 400 },
    );
  }

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Message not found." },
      { status: 404 },
    );
  }

  const message = await prisma.contactMessage.update({
    where: { id },
    data: { isRead },
  });

  return NextResponse.json(message);
}

export async function DELETE(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Message id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Message not found." },
      { status: 404 },
    );
  }

  await prisma.contactMessage.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}