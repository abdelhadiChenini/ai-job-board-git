"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
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
  type QuizQuestion,
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
  const [showSlides, setShowSlides] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  if (slide.type === "video") {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="relative w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/50" style={{ paddingTop: "56.25%" }}>
          <iframe
            src={slide.videoUrl || "https://www.youtube.com/embed/moP3MxU8lUE"}
            title="Course Video"
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        {slide.showSlidesToggle && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => setShowSlides((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              For further reference: {showSlides ? "Close the presentation" : "Open the presentation"}
              {showSlides ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showSlides && (
              <div className="w-full relative overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/50" style={{ paddingTop: "56.25%" }}>
                <iframe
                  src={slide.slidesEmbedUrl || "https://docs.google.com/presentation/d/1P04UpVDOt9ygqPioPibSHtBlXaEJ7_FlcteR4Qm-WaQ/embed?start=false&loop=false&delayms=3000"}
                  title="Course Slides"
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (slide.type === "quiz" && slide.quiz) {
    const questions = slide.quiz;
    const allAnswered = questions.every((q) => quizAnswers[q.id] !== undefined);
    const score = questions.reduce((acc, q) => acc + (quizAnswers[q.id] === q.correctAnswer ? 1 : 0), 0);
    const passed = score === questions.length;

    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">MECE & Rubrics Quiz</h2>
        <p className="mt-2 text-slate-400">Answer all questions to continue.</p>
        <div className="mt-8 space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-lg font-medium text-white">
                {idx + 1}. {q.question}
              </p>
              <div className="mt-4 space-y-2">
                {q.options.map((opt, optIdx) => {
                  const selected = quizAnswers[q.id] === optIdx;
                  const correct = quizSubmitted && optIdx === q.correctAnswer;
                  const wrong = quizSubmitted && selected && optIdx !== q.correctAnswer;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={quizSubmitted}
                      onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                      className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                        correct
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : wrong
                            ? "border-red-500 bg-red-500/10 text-red-400"
                            : selected
                              ? "border-accent bg-accent/10 text-white"
                              : "border-white/10 text-slate-300 hover:bg-white/5"
                      } ${quizSubmitted ? "cursor-not-allowed" : ""}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {quizSubmitted && q.explanation && (
                <p className="mt-3 text-sm text-slate-400">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          {quizSubmitted ? (
            <p className={`text-sm font-medium ${passed ? "text-emerald-400" : "text-amber-400"}`}>
              Score: {score}/{questions.length} {passed ? "(All correct!)" : "(Review and try again conceptually - you can continue)"} 
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              {allAnswered ? "All questions answered" : "Please answer all questions"}
            </p>
          )}
          {!quizSubmitted && (
            <button
              type="button"
              onClick={() => setQuizSubmitted(true)}
              disabled={!allAnswered}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  if (slide.type === "title") {
    return (
      <div className="mx-auto max-w-2xl text-center">
        {slide.eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            {slide.eyebrow}
          </p>
        )}
        <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
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
      <div className="mx-auto max-w-3xl">
        {slide.heading && (
          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
            {slide.heading}
          </h2>
        )}
        <ul className="mt-7 space-y-3">
          {(slide.bullets ?? []).map((bullet, index) => (
            <li
              key={`${slide.id}-bullet-${index}`}
              className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-base leading-relaxed text-slate-200"
            >
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {slide.heading && (
        <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
          {slide.heading}
        </h2>
      )}
      {(slide.body ?? "").split(/\n{2,}/).map((paragraph, index) => (
        <p
          key={`${slide.id}-paragraph-${index}`}
          className="mt-5 whitespace-pre-line text-lg leading-relaxed text-slate-300"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

const MECE_QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "What does MECE stand for in the context of rubric criteria?",
    options: [
      "Most Effective Criteria Evaluation",
      "Mutually Exclusive and Collectively Exhaustive",
      "Measured Evaluation of Criteria Effectiveness",
      "Methodical Evaluation for Consistent Excerpts",
    ],
    correctAnswer: 1,
    explanation: "MECE means Mutually Exclusive (no overlap) and Collectively Exhaustive (together they fully define the ideal response).",
  },
  {
    id: "q2",
    question: "What does 'atomicity' mean for a rubric criterion?",
    options: [
      "It must be written using scientific terminology",
      "Each criterion should evaluate exactly one distinct aspect",
      "Criteria must be ordered by importance",
      "Each criterion must reference atomic units of text",
    ],
    correctAnswer: 1,
    explanation: "Each rubric criterion should evaluate exactly one distinct aspect - avoid stacking multiple ideas with 'and'.",
  },
  {
    id: "q3",
    question: "Which of the following best describes 'self-containment' in rubric design?",
    options: [
      "The rubric must fit on a single page",
      "Each criterion should contain all information needed to evaluate a response without external research",
      "Criteria should be self-explanatory to automated systems only",
      "The rubric doesn't need examples if it's self-contained",
    ],
    correctAnswer: 1,
    explanation: "Self-containment means each criterion has all information needed to evaluate a response, verifiable without external research.",
  },
  {
    id: "q4",
    question: "When comparing the 'grading rubric' metaphor vs 'recipe' metaphor, which statement is true?",
    options: [
      "They are completely different concepts with no overlap",
      "A rubric is like a checklist/recipe of everything needed for the perfect answer, similar to how grading rubrics distinguish better from worse responses",
      "The recipe metaphor only applies to cooking-related prompts",
      "Grading rubrics are only used in schools, not in AI evaluation",
    ],
    correctAnswer: 1,
    explanation: "Both metaphors help - rubrics distinguish better from worse responses and act as a recipe/checklist for the ideal response.",
  },
  {
    id: "q5",
    question: "Which principle helps ensure rubric criteria are precise and verifiable?",
    options: [
      "Verbosity",
      "Specificity (stating precisely what is expected and being binary true/false)",
      "Ambiguity",
      "Generalization",
    ],
    correctAnswer: 1,
    explanation: "Specificity means criteria should state precisely what is expected and be binary (true/false).",
  },
];

export default function CoursePlayer({
  courseId,
  title,
  category,
  duration,
  modules: originalModules,
  completedSteps: initialCompletedSteps,
  targetSteps,
  status: initialStatus,
}: CoursePlayerProps) {
  const isRubricCourse = title?.includes("Fundamentals of Data Annotation");

  const modules = useMemo(() => {
    if (!isRubricCourse) return originalModules;
    // Build custom modules for the rubric course as specified
    return [
      {
        id: "module-intro",
        title: "Introduction",
        slides: [
          {
            id: "intro-video",
            type: "video" as const,
            videoUrl: "https://www.youtube.com/embed/moP3MxU8lUE",
            showSlidesToggle: true,
            slidesEmbedUrl: "https://docs.google.com/presentation/d/1P04UpVDOt9ygqPioPibSHtBlXaEJ7_FlcteR4Qm-WaQ/embed?start=false&loop=false&delayms=3000",
          },
        ],
      },
      {
        id: "module-quiz",
        title: "MECE & Rubrics Quiz",
        slides: [
          {
            id: "quiz-1",
            type: "quiz" as const,
            quiz: MECE_QUIZ_QUESTIONS,
          },
        ],
      },
    ];
  }, [isRubricCourse, originalModules]);

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
  const courseTotalSlides = useMemo(
    () => modules.reduce((total, mod) => total + mod.slides.length, 0),
    [modules]
  );
  const slidesBeforeModule = useMemo(
    () => modules.slice(0, moduleIndex).reduce((total, mod) => total + mod.slides.length, 0),
    [modules, moduleIndex]
  );
  const courseSlidePosition = slidesBeforeModule + slideIndex + 1;
  const slidePercent =
    courseTotalSlides > 0 ? Math.round((courseSlidePosition / courseTotalSlides) * 100) : 0;

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

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
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
              Complete Module
            </button>
          )
        ) : isLastSlide ? (
          moduleIsComplete ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
            >
              Next Module
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={markComplete}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
            >
              <CircleCheck className="h-4 w-4" />
              Complete Module
            </button>
          )
        ) : isCourseOpening ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
          >
            Jump in
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
          >
            Next Slide
            <ChevronRight className="h-4 w-4" />
          </button>
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

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/40">
        <header className="border-b border-white/10 bg-slate-900/90 px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                  {category}
                </span>
                {duration && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    {duration}
                  </span>
                )}
              </div>
              <p className="mt-1.5 flex min-w-0 items-baseline gap-2">
                <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Module {moduleIndex + 1}/{modules.length}
                </span>
                <span className="truncate text-sm font-semibold text-white">
                  {activeModule.title}
                </span>
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

          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${slidePercent}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>
                {courseSlidePosition} of {courseTotalSlides} slides completed
              </span>
              <span className="text-slate-400">{slidePercent}%</span>
            </div>
          </div>
        </header>

        <div className="flex max-h-[calc(100vh-20rem)] min-h-[420px] flex-1 flex-col overflow-y-auto bg-slate-950/60 px-4 py-7 sm:px-8 sm:py-9 lg:min-h-[470px]">
          <div
            key={activeSlide.id}
            className={`mx-auto my-auto w-full animate-fade-up rounded-2xl border border-white/5 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/50 sm:p-10 ${
              activeSlide.type === "video" || activeSlide.type === "quiz" ? "max-w-5xl" : "max-w-3xl"
            }`}
          >
            <SlideBody slide={activeSlide} />
          </div>
        </div>

        <footer className="border-t border-white/10 bg-slate-900/90 px-5 py-4 sm:px-8">
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
