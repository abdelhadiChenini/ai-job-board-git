import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";

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
    select: { plan: true },
  });

  const plan = normalizePlan(user?.plan ?? null);
  if (plan !== "PRO") {
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

  const steps = course.steps || 0;
  const completedSteps = progress.completedSteps || 0;
  const currentStep = Math.min(steps, completedSteps + 1);
  const isCompleted = progress.status === "COMPLETED" || completedSteps >= steps;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/dashboard/training" className="text-sm text-slate-400 hover:text-white">
          ← Back to training
        </Link>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{course.category}</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">{course.title}</h1>
          </div>
          {course.duration && <span className="text-sm text-slate-400">{course.duration}</span>}
        </div>
        <p className="text-sm text-slate-400">{course.description}</p>
        <div className="mt-6">
          <div className="h-2 w-full rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-accent transition-all"
              style={{ width: `${steps ? Math.min(100, (completedSteps / steps) * 100) : 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {completedSteps} of {steps} steps completed
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">
              {isCompleted ? "Course completed" : `Step ${currentStep} of ${steps}`}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {isCompleted
                ? "You've completed all training modules. Great work!"
                : "Follow the instructional content and complete the checkpoint for this step."}
            </p>
          </div>
          <div className="flex justify-end">
            <form action={`/api/courses/${course.id}/progress`} method="post">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
              >
                {isCompleted ? "Mark as reviewed" : "Complete step"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
