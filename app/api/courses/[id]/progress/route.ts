import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const plan = normalizePlan(user?.plan ?? null);
  if (plan !== "PRO") {
    return NextResponse.json({ error: "Pro subscription required" }, { status: 403 });
  }

  const { id } = await params;
  const courseId = id;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course || !course.published) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  let progress = await prisma.userProgress.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  });

  if (!progress) {
    progress = await prisma.userProgress.create({
      data: {
        userId: session.user.id,
        courseId,
        completedSteps: 0,
        status: "IN_PROGRESS",
      },
    });
  }

  const steps = course.steps || 0;
  const newCompletedSteps = (progress.completedSteps || 0) + 1;

  if (newCompletedSteps >= steps && steps > 0) {
    progress = await prisma.userProgress.update({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
      data: {
        completedSteps: steps,
        status: "COMPLETED",
        updatedAt: new Date(),
      },
    });
  } else {
    progress = await prisma.userProgress.update({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
      data: {
        completedSteps: newCompletedSteps,
        status: "IN_PROGRESS",
        updatedAt: new Date(),
      },
    });
  }

  const referer = request.headers.get("referer");
  if (referer) {
    return NextResponse.redirect(referer);
  }
  return NextResponse.redirect(new URL(`/dashboard/training/${courseId}`, request.url));
}
