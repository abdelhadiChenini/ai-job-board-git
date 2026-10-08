"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  computeProgressPercent,
  type CourseModule,
  type CourseProgressStatus,
  type CourseProgressUpdate,
  type CourseSlide,
} from "@/lib/courses";

type SyncState = "idle" | "saving" | "saved" | "error";

type CoursePlayerProps = {
  courseId: string;
  title: string;
  category: string;
  duration: string | null;
  modules: CourseModule[];
  completedSteps: number;
  targetSteps: number;
  status: CourseProgressStatus;
};

function stepLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function SlideBody({ slide }: { slide: CourseSlide }) {
  if (slide.type === "title") {
    return (
      <div className="mx-auto max-w-2xl text-center">
        {slide.eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            {slide.eyebrow}
          </p>
        )}
        <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="mt-4 text-base leading-relaxed text-slate-400">{slide.subtitle}</p>
        )}
      </div>
    );
  }

  if (slide.type === "bullets") {
    return (
      <div className="mx-auto max-w-2xl">
        {slide.heading && (
          <h2 className="text-2xl font-semibold leading-snug text-white">{slide.heading}</h2>
        )}
        <ul className="mt-6 space-y-3">
          {(slide.bullets ?? []).map((bullet, index) => (
            <li
              key={`${slide.id}-bullet-${index}`}
              className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200"
            >
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {slide.heading && (
        <h2 className="text-2xl font-semibold leading-snug text-white">{slide.heading}</h2>
      )}
      {(slide.body ?? "").split(/\n{2,}/).map((paragraph, index) => (
        <p
          key={`${slide.id}-paragraph-${index}`}
          className="mt-4 whitespace-pre-line text-base leading-relaxed text-slate-300"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default function CoursePlayer({
  courseId,
  title,
  category,
  duration,
  modules,
  completedSteps: initialCompletedSteps,
  targetSteps,
  status: initialStatus,
}: CoursePlayerProps) {
  const initialModule = Math.min(
    Math.max(initialCompletedSteps, 0),
    Math.max(modules.length - 1, 0)
  );

  const [moduleIndex, setModuleIndex] = useState(initialModule);
  const [slideIndex, setSlideIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(initialCompletedSteps);
  const [status, setStatus] = useState<CourseProgressStatus>(initialStatus);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeModule = modules[moduleIndex];
  const activeSlide = activeModule?.slides[slideIndex];
  const totalSlides = activeModule?.slides.length ?? 0;
  const isFirstSlide = slideIndex === 0;
  const isLastSlide = slideIndex >= totalSlides - 1;
  const isCourseOpening = moduleIndex === 0 && isFirstSlide;
  const isCourseEnd = moduleIndex === modules.length - 1 && isLastSlide;
  const moduleIsComplete = moduleIndex < completedSteps;
  const allComplete = targetSteps > 0 && completedSteps >= targetSteps;
  const percent = computeProgressPercent(completedSteps, targetSteps);

  const goToSlide = useCallback(
    (nextModule: number, nextSlide: number) => {
      const clampedModule = Math.max(0, Math.min(nextModule, modules.length - 1));
      const slideCount = modules[clampedModule]?.slides.length ?? 1;
      setModuleIndex(clampedModule);
      setSlideIndex(Math.max(0, Math.min(nextSlide, slideCount - 1)));
      containerRef.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
    },
    [modules]
  );

  const syncProgress = useCallback(
    async (nextCompletedSteps: number) => {
      setCompletedSteps(nextCompletedSteps);
      setSyncState("saving");
      try {
        const response = await fetch(`/api/courses/${courseId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedSteps: nextCompletedSteps }),
        });
        if (!response.ok) throw new Error("Progress update failed");
        const data = (await response.json()) as CourseProgressUpdate;
        setCompletedSteps(data.completedSteps ?? nextCompletedSteps);
        if (data.status) setStatus(data.status);
        setSyncState("saved");
      } catch {
        setSyncState("error");
      }
    },
    [courseId]
  );

  const goNext = useCallback(() => {
    if (!activeModule) return;
    if (!isLastSlide) {
      goToSlide(moduleIndex, slideIndex + 1);
    } else if (moduleIndex < modules.length - 1) {
      goToSlide(moduleIndex + 1, 0);
    }
  }, [activeModule, goToSlide, isLastSlide, moduleIndex, modules.length, slideIndex]);

  const goPrevious = useCallback(() => {
    if (slideIndex > 0) {
      goToSlide(moduleIndex, slideIndex - 1);
    } else if (moduleIndex > 0) {
      goToSlide(moduleIndex - 1, modules[moduleIndex - 1].slides.length - 1);
    }
  }, [goToSlide, moduleIndex, modules, slideIndex]);

  const markComplete = useCallback(() => {
    const nextCompleted = Math.max(completedSteps, moduleIndex + 1);
    void syncProgress(nextCompleted);
    if (moduleIndex < modules.length - 1) {
      goToSlide(moduleIndex + 1, 0);
    }
  }, [completedSteps, goToSlide, moduleIndex, modules.length, syncProgress]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrevious]);

  const syncLabel = useMemo(() => {
    if (syncState === "saving") return "Saving progress…";
    if (syncState === "saved") return "Progress synced";
    if (syncState === "error") return "Couldn't sync progress";
    return null;
  }, [syncState]);

  if (!activeModule || !activeSlide) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-8 text-center text-slate-400">
        This course does not have any modules yet.
      </div>
    );
  }

  const footerActions = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={goPrevious}
        disabled={moduleIndex === 0 && isFirstSlide}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <div className="flex flex-wrap items-center gap-3">
        {isCourseEnd ? (
          allComplete ? (
            <Link
              href="/dashboard/training"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
            >
              Back to training
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={markComplete}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
            >
              <CircleCheck className="h-4 w-4" />
              Mark Complete
            </button>
          )
        ) : (
          <>
            {!isLastSlide && (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
              >
                Next Slide
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {isCourseOpening && (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
              >
                Jump in
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {isLastSlide && !moduleIsComplete && (
              <button
                type="button"
                onClick={markComplete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
              >
                <CircleCheck className="h-4 w-4" />
                Mark Complete
              </button>
            )}
            {isLastSlide && moduleIsComplete && (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
              >
                Next Module
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="shrink-0 rounded-2xl border border-white/10 bg-slate-950/80 p-4 lg:sticky lg:top-6 lg:w-72 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto xl:w-80">
        <p className="text-sm font-semibold leading-snug text-white">{title}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Course content
          </p>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-400">
            {modules.length} modules
          </span>
        </div>

        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {completedSteps} of {targetSteps || modules.length} modules completed
            </span>
            <span className="font-medium text-slate-300">{percent}%</span>
          </div>
        </div>

        <ol className="mt-5 space-y-1.5">
          {modules.map((mod, index) => {
            const isComplete = index < completedSteps;
            const isActive = index === moduleIndex;
            return (
              <li key={mod.id}>
                <button
                  type="button"
                  onClick={() => goToSlide(index, 0)}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
                    isActive
                      ? "bg-accent/10 ring-1 ring-accent/40"
                      : "hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isComplete
                        ? "bg-emerald-500/15 text-emerald-400"
                        : isActive
                          ? "bg-accent text-slate-950"
                          : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : stepLabel(index)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-medium leading-snug ${
                        isActive ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {mod.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {mod.slides.length} slides
                      {isComplete && " · Completed"}
                    </span>
                  </span>
                  {isComplete && (
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-xs text-slate-500">
            {syncLabel ?? "Use the arrow keys to move between slides."}
          </p>
          {syncState === "error" && (
            <button
              type="button"
              onClick={() => void syncProgress(completedSteps)}
              className="mt-2 text-xs font-medium text-accent hover:underline"
            >
              Retry sync
            </button>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
        <header className="border-b border-white/10 px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                {category}
                {duration && (
                  <span className="ml-2 inline-flex items-center gap-1 font-medium text-slate-400 normal-case tracking-normal">
                    <Clock className="h-3 w-3" />
                    {duration}
                  </span>
                )}
              </p>
              <p className="mt-1 truncate text-sm text-slate-400">
                Module {moduleIndex + 1} of {modules.length} · {activeModule.title}
              </p>
            </div>
            <span className="inline-flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  status === "COMPLETED"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : status === "IN_PROGRESS"
                      ? "bg-accent/10 text-accent"
                      : "bg-white/5 text-slate-400"
                }`}
              >
                {status === "COMPLETED"
                  ? "Completed"
                  : status === "IN_PROGRESS"
                    ? "In progress"
                    : "Not started"}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                Slide {slideIndex + 1} of {totalSlides}
              </span>
            </span>
          </div>

          <div className="mt-4 flex gap-1.5">
            {activeModule.slides.map((item, index) => (
              <span
                key={item.id}
                className={`h-1 flex-1 rounded-full transition ${
                  index <= slideIndex ? "bg-accent" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </header>

        <div className="flex min-h-[420px] flex-1 items-center justify-center bg-slate-950/50 px-5 py-12 sm:px-10 lg:min-h-[520px]">
          <div key={activeSlide.id} className="w-full animate-fade-up">
            <SlideBody slide={activeSlide} />
          </div>
        </div>

        <footer className="border-t border-white/10 bg-slate-900/60 px-5 py-4 sm:px-8">
          {allComplete && !isCourseEnd && (
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              Course completed — review any module below.
            </p>
          )}
          {footerActions}
        </footer>
      </section>
    </div>
  );
}
