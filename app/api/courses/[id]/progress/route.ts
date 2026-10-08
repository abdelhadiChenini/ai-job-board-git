import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";
import {
  computeProgressPercent,
  resolveCourseTarget,
  resolveProgressStatus,
} from "@/lib/courses";

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
    select: { plan: true, role: true },
  });

  const plan = normalizePlan(user?.plan ?? null);
  const isAdmin = user?.role === "ADMIN";
  if (!isAdmin && plan !== "PRO") {
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

  const contentType = request.headers.get("content-type") ?? "";
  const wantsJson = contentType.includes("application/json");

  let requestedSteps: number | null = null;
  if (wantsJson) {
    try {
      const body = await request.json();
      const raw = body?.completedSteps;
      if (typeof raw === "number" && Number.isFinite(raw)) {
        requestedSteps = Math.max(0, Math.floor(raw));
      }
    } catch {
      requestedSteps = null;
    }
  }

  const targetSteps = resolveCourseTarget(course);

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

  const currentSteps = progress.completedSteps || 0;
  const nextCompletedSteps =
    requestedSteps !== null ? requestedSteps : currentSteps + 1;
  const completedSteps = targetSteps
    ? Math.min(nextCompletedSteps, targetSteps)
    : nextCompletedSteps;
  const status = resolveProgressStatus(completedSteps, targetSteps);

  progress = await prisma.userProgress.update({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
    data: {
      completedSteps,
      status,
      updatedAt: new Date(),
    },
  });

  const payload = {
    completedSteps: progress.completedSteps,
    targetSteps,
    percent: computeProgressPercent(progress.completedSteps, targetSteps),
    status: progress.status,
  };

  if (wantsJson) {
    return NextResponse.json(payload);
  }

  const referer = request.headers.get("referer");
  if (referer) {
    return NextResponse.redirect(referer);
  }
  return NextResponse.redirect(new URL(`/dashboard/training/${courseId}`, request.url));
}
