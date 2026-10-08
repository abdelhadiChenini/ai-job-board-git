import { describe, expect, it } from "vitest";
import {
  buildFallbackModules,
  computeProgressPercent,
  getCourseModules,
  parseCourseModules,
  resolveCourseTarget,
  resolveProgressStatus,
} from "@/lib/courses";

const moduleFixture = [
  {
    id: "m1",
    title: "Foundations of Rubrics",
    slides: [
      {
        id: "s1",
        type: "title",
        eyebrow: "Module 01",
        title: "Foundations of Rubrics",
        subtitle: "Why scoring standards matter.",
      },
      {
        id: "s2",
        type: "bullets",
        heading: "Why rubrics matter",
        bullets: ["Comparable measurements", "Convergent judgments"],
      },
      {
        id: "s3",
        type: "text",
        heading: "The consistency contract",
        body: "First paragraph.\n\nSecond paragraph.",
      },
    ],
  },
];

describe("parseCourseModules", () => {
  it("reads an ordered module list with typed slides", () => {
    const modules = parseCourseModules(moduleFixture);

    expect(modules).toHaveLength(1);
    expect(modules[0].title).toBe("Foundations of Rubrics");
    expect(modules[0].slides).toHaveLength(3);
    expect(modules[0].slides.map((slide) => slide.type)).toEqual([
      "title",
      "bullets",
      "text",
    ]);
    expect(modules[0].slides[1].bullets).toEqual([
      "Comparable measurements",
      "Convergent judgments",
    ]);
  });

  it("infers the slide type when it is missing", () => {
    const modules = parseCourseModules([
      {
        title: "Module",
        slides: [{ title: "Opening" }, { bullets: ["one"] }, { body: "copy" }],
      },
    ]);

    expect(modules[0].slides.map((slide) => slide.type)).toEqual([
      "title",
      "bullets",
      "text",
    ]);
  });

  it("returns an empty list for malformed input", () => {
    expect(parseCourseModules(null)).toEqual([]);
    expect(parseCourseModules("nope")).toEqual([]);
    expect(parseCourseModules([{ title: "Empty", slides: [] }])).toEqual([]);
    expect(parseCourseModules([{ title: "No slides" }])).toEqual([]);
  });

  it("skips blank slides but keeps the module when others have content", () => {
    const modules = parseCourseModules([
      { title: "Module", slides: [{ id: "blank" }, { title: "Real" }] },
    ]);

    expect(modules).toHaveLength(1);
    expect(modules[0].slides).toHaveLength(1);
    expect(modules[0].slides[0].title).toBe("Real");
  });
});

describe("fallback modules", () => {
  const course = {
    title: "Course",
    description: "Learn things.",
    category: "LEARNING PATH",
    duration: "45 min",
    skills: ["Skill A", "Skill B"],
  };

  it("builds an introductory module when no modules are stored", () => {
    const modules = buildFallbackModules(course);

    expect(modules).toHaveLength(1);
    expect(modules[0].slides[0].type).toBe("title");
    expect(modules[0].slides[0].title).toBe("Course");
    const skillSlide = modules[0].slides.find((slide) => slide.type === "bullets");
    expect(skillSlide?.bullets).toEqual(["Skill A", "Skill B"]);
  });

  it("prefers stored modules over the fallback", () => {
    const modules = getCourseModules({ ...course, modules: moduleFixture });

    expect(modules[0].title).toBe("Foundations of Rubrics");
  });

  it("falls back when the stored modules are empty", () => {
    const modules = getCourseModules({ ...course, modules: [] });

    expect(modules[0].slides[0].subtitle).toBe("Learn things.");
  });
});

describe("progress helpers", () => {
  it("targets the module count when slide content exists", () => {
    expect(resolveCourseTarget({ modules: moduleFixture, steps: 9 })).toBe(1);
    expect(resolveCourseTarget({ modules: [], steps: 4 })).toBe(4);
    expect(resolveCourseTarget({ steps: null })).toBe(0);
  });

  it("clamps the completion percentage", () => {
    expect(computeProgressPercent(0, 4)).toBe(0);
    expect(computeProgressPercent(1, 4)).toBe(25);
    expect(computeProgressPercent(5, 4)).toBe(100);
    expect(computeProgressPercent(3, 0)).toBe(0);
  });

  it("derives the progress status", () => {
    expect(resolveProgressStatus(0, 3)).toBe("NOT_STARTED");
    expect(resolveProgressStatus(1, 3)).toBe("IN_PROGRESS");
    expect(resolveProgressStatus(3, 3)).toBe("COMPLETED");
    expect(resolveProgressStatus(4, 3)).toBe("COMPLETED");
  });
});
