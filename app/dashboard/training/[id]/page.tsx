import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";
import { computeProgressPercent, getCourseModules } from "@/lib/courses";
import CoursePlayer from "./CoursePlayer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    select: { title: true, description: true },
  });
  if (!course) return { title: "Course Not Found" };
  return { title: course.title, description: course.description };
}

export default async function TrainingCoursePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/login?callbackUrl=/dashboard/training/${id}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, role: true },
  });

  const plan = normalizePlan(user?.plan ?? null);
  const isAdmin = user?.role === "ADMIN";
  if (!isAdmin && plan !== "PRO") {
    redirect("/pricing?from=training");
  }

  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course || !course.published) {
    notFound();
  }

  let progress = await prisma.userProgress.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course.id,
      },
    },
  });

  if (!progress) {
    progress = await prisma.userProgress.create({
      data: {
        userId: session.user.id,
        courseId: course.id,
        completedSteps: 0,
        status: "NOT_STARTED",
      },
    });
  }

  const modules = getCourseModules(course);
  const targetSteps = modules.length || course.steps || 0;
  const completedSteps = Math.max(
    0,
    Math.min(progress.completedSteps || 0, targetSteps || progress.completedSteps || 0)
  );
  const percent = computeProgressPercent(completedSteps, targetSteps);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/training"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to training
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {percent}% complete
        </span>
      </div>

      <CoursePlayer
        courseId={course.id}
        title={course.title}
        category={course.category}
        duration={course.duration}
        modules={modules}
        completedSteps={completedSteps}
        targetSteps={targetSteps}
        status={progress.status}
      />
    </main>
  );
}
