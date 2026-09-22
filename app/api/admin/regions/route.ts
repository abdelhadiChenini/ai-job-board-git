import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, readJsonBody } from "@/lib/admin";

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized." },
  { status: 401 },
);

export async function GET() {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(regions);
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

  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "Region name is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.region.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "A region with this name already exists." },
      { status: 409 },
    );
  }

  const region = await prisma.region.create({ data: { name } });

  return NextResponse.json(region, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Region id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.region.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Region not found." },
      { status: 404 },
    );
  }

  await prisma.region.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}