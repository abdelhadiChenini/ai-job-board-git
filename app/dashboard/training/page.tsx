import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";
import DashboardSidebar from "../DashboardSidebar";

export const metadata: Metadata = {
  title: "Training & Courses",
};

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/training");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const plan = normalizePlan(user?.plan ?? null);
  if (plan !== "PRO") {
    redirect("/pricing?from=training");
  }

  const [courses, progressRows] = await Promise.all([
    prisma.course.findMany({
      where: { published: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userProgress.findMany({
      where: { userId: session.user.id },
    }),
  ]);

  const progressMap = new Map(progressRows.map((p: any) => [p.courseId, p]));

  const getActionLabel = (courseId: string, steps: number) => {
    const p: any = progressMap.get(courseId);
    if (!p || p.status === "NOT_STARTED" || p.completedSteps === 0) return "Start";
    if (p.status === "COMPLETED" || (p.completedSteps >= steps && steps > 0)) return "View details";
    return "Continue";
  };

  const learningPaths = courses.filter((c: any) => c.category === "LEARNING PATH");
  const playgrounds = courses.filter((c: any) => c.category !== "LEARNING PATH");

  const activeCourse = progressRows.find(
    (p: any) => p.status === "IN_PROGRESS" || (p.completedSteps > 0 && p.status !== "COMPLETED")
  );
  let activeCourseData: any = null;
  if (activeCourse) {
    activeCourseData = courses.find((c: any) => c.id === activeCourse.courseId) || null;
  }

  return (
    <section className="flex flex-col gap-8 lg:flex-row">
      <DashboardSidebar />
      <main className="flex-1 space-y-8">
        {activeCourseData && (
          <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Pick up where you left off</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{activeCourseData.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{activeCourseData.description}</p>
              </div>
              <Link
                href={`/dashboard/training/${activeCourseData.id}`}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
              >
                {getActionLabel(activeCourseData.id, activeCourseData.steps || 1)}
              </Link>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-accent transition-all"
                  style={{
                    width: `${
                      activeCourseData.steps
                        ? Math.min(100, ((activeCourse?.completedSteps || 0) / activeCourseData.steps) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {activeCourse?.completedSteps || 0} of {activeCourseData.steps || 0} steps completed
              </p>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-white">Learning Paths</h2>
          {learningPaths.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No learning paths published yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {learningPaths.map((course: any) => {
                const skills = Array.isArray(course.skills) ? (course.skills as string[]) : [];
                return (
                  <div key={course.id} className="rounded-2xl border border-white/10 bg-slate-800/70 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">LEARNING PATH</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{course.title}</h3>
                      </div>
                      {course.duration && <span className="text-xs text-slate-400">{course.duration}</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{course.description}</p>
                    {skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {skills.map((skill: string) => (
                          <span key={skill} className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{course.steps} steps</span>
                      <Link
                        href={`/dashboard/training/${course.id}`}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
                      >
                        {getActionLabel(course.id, course.steps)}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Playgrounds</h2>
          {playgrounds.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No playground modules published yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {playgrounds.map((course: any) => {
                const skills = Array.isArray(course.skills) ? (course.skills as string[]) : [];
                return (
                  <div key={course.id} className="rounded-2xl border border-white/10 bg-slate-800/70 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">PLAYGROUND</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{course.title}</h3>
                      </div>
                      {course.duration && <span className="text-xs text-slate-400">{course.duration}</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{course.description}</p>
                    {skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {skills.map((skill: string) => (
                          <span key={skill} className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{course.steps} steps</span>
                      <Link
                        href={`/dashboard/training/${course.id}`}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
                      >
                        {getActionLabel(course.id, course.steps)}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </section>
  );
}
