import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ savedOpportunityIds: [] });
  }

  const savedRows = await prisma.savedOpportunity.findMany({
    where: { userId: session.user.id },
    select: { opportunityId: true },
  });

  return NextResponse.json({
    savedOpportunityIds: savedRows.map((row) => row.opportunityId),
  });
}
