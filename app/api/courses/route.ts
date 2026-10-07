import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const plan = normalizePlan(user?.plan ?? null);

  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: "asc" },
  });

  const progressRows = await prisma.userProgress.findMany({
    where: { userId: session.user.id },
  });

  const progressMap = new Map(progressRows.map((p) => [p.courseId, p]));

  const coursesWithProgress = courses.map((course) => ({
    ...course,
    progress: progressMap.get(course.id) || {
      id: null,
      userId: session.user.id,
      courseId: course.id,
      completedSteps: 0,
      status: "NOT_STARTED",
      createdAt: null,
      updatedAt: null,
    },
    isProOnly: true,
  }));

  return NextResponse.json({ courses: coursesWithProgress, userPlan: plan });
}
