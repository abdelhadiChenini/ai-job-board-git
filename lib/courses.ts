export type CourseSlideType = "title" | "bullets" | "text";

export type CourseSlide = {
  id: string;
  type: CourseSlideType;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  heading?: string;
  bullets?: string[];
  body?: string;
};

export type CourseModule = {
  id: string;
  title: string;
  slides: CourseSlide[];
};

export type CourseProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type CourseProgressUpdate = {
  completedSteps: number;
  targetSteps: number;
  percent: number;
  status: CourseProgressStatus;
};

const SLIDE_TYPES: CourseSlideType[] = ["title", "bullets", "text"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

function normalizeSlide(
  raw: unknown,
  moduleIndex: number,
  slideIndex: number
): CourseSlide | null {
  if (!isRecord(raw)) return null;

  const declaredType = asString(raw.type) as CourseSlideType | undefined;
  const type: CourseSlideType =
    declaredType && SLIDE_TYPES.includes(declaredType)
      ? declaredType
      : raw.bullets
        ? "bullets"
        : slideIndex === 0 && raw.title
          ? "title"
          : "text";

  const slide: CourseSlide = {
    id: asString(raw.id) ?? `module-${moduleIndex + 1}-slide-${slideIndex + 1}`,
    type,
  };

  const eyebrow = asString(raw.eyebrow);
  const title = asString(raw.title);
  const subtitle = asString(raw.subtitle);
  const heading = asString(raw.heading) ?? (type === "text" ? title : undefined);
  const body = asString(raw.body);
  const bullets = asStringList(raw.bullets);

  if (eyebrow) slide.eyebrow = eyebrow;
  if (title) slide.title = title;
  if (subtitle) slide.subtitle = subtitle;
  if (heading) slide.heading = heading;
  if (bullets) slide.bullets = bullets;
  if (body) slide.body = body;

  const hasContent =
    Boolean(slide.title || slide.subtitle || slide.heading || slide.body) ||
    Boolean(slide.bullets?.length);

  return hasContent ? slide : null;
}

/**
 * Reads the `Course.modules` JSON column into a typed, ordered module list.
 * Returns an empty array when the column is missing, malformed, or empty.
 */
export function parseCourseModules(raw: unknown): CourseModule[] {
  if (!Array.isArray(raw)) return [];

  const modules: CourseModule[] = [];

  raw.forEach((entry, moduleIndex) => {
    if (!isRecord(entry)) return;

    const slides = Array.isArray(entry.slides)
      ? entry.slides
          .map((slide, slideIndex) => normalizeSlide(slide, moduleIndex, slideIndex))
          .filter((slide): slide is CourseSlide => slide !== null)
      : [];

    if (!slides.length) return;

    modules.push({
      id: asString(entry.id) ?? `module-${moduleIndex + 1}`,
      title: asString(entry.title) ?? `Module ${moduleIndex + 1}`,
      slides,
    });
  });

  return modules;
}

/**
 * Courses seeded before the slide-presentation upgrade may not carry modules
 * yet. Synthesise a single introductory module so the player always has
 * something meaningful to render.
 */
export function buildFallbackModules(course: {
  title: string;
  description: string;
  category: string;
  duration?: string | null;
  skills?: unknown;
}): CourseModule[] {
  const skills = asStringList(course.skills) ?? [];
  const slides: CourseSlide[] = [
    {
      id: "intro-title",
      type: "title",
      eyebrow: course.category,
      title: course.title,
      subtitle: course.description,
    },
  ];

  if (skills.length) {
    slides.push({
      id: "intro-skills",
      type: "bullets",
      heading: "What you will work on",
      bullets: skills,
    });
  }

  slides.push({
    id: "intro-about",
    type: "text",
    heading: "About this course",
    body: `${course.description}${course.duration ? ` Estimated time: ${course.duration}.` : ""}`,
  });

  return [
    {
      id: "intro",
      title: course.title,
      slides,
    },
  ];
}

export function getCourseModules(course: {
  modules?: unknown;
  title: string;
  description: string;
  category: string;
  duration?: string | null;
  skills?: unknown;
}): CourseModule[] {
  const modules = parseCourseModules(course.modules);
  return modules.length ? modules : buildFallbackModules(course);
}

/**
 * The number of completion units the progress API should track: the module
 * count when slide content exists, otherwise the legacy `steps` column.
 */
export function resolveCourseTarget(course: {
  modules?: unknown;
  steps?: number | null;
}): number {
  const moduleCount = parseCourseModules(course.modules).length;
  if (moduleCount) return moduleCount;
  return course.steps || 0;
}

export function computeProgressPercent(completedSteps: number, targetSteps: number): number {
  if (!targetSteps) return 0;
  return Math.max(0, Math.min(100, Math.round((completedSteps / targetSteps) * 100)));
}

export function resolveProgressStatus(completedSteps: number, targetSteps: number): CourseProgressStatus {
  if (!targetSteps || completedSteps <= 0) return completedSteps > 0 ? "IN_PROGRESS" : "NOT_STARTED";
  if (completedSteps >= targetSteps) return "COMPLETED";
  return "IN_PROGRESS";
}
