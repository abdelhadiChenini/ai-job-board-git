import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized." },
  { status: 401 },
);

export async function GET() {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [unreadMessages, newUsers] = await Promise.all([
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
  ]);

  return NextResponse.json({
    total: unreadMessages + newUsers,
    unreadMessages,
    newUsers,
  });
}