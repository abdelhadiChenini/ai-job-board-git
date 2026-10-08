// Safely seeds the slide content for the Training Hub rubrics course.
//
// Non-destructive: the course is upserted by its unique title — existing rows
// are updated in place and nothing is ever deleted. The `rubricCourseModules`
// data below is the single source of truth; `prisma/courseContent.ts`
// re-exports it so `npx prisma db seed` writes the exact same slides.
//
// Run directly with: npx tsx scripts/seed-courses.ts
// Importing this file only exposes the data — the runner fires only when the
// file itself is executed.

import { PrismaClient } from "@prisma/client";

export const RUBRIC_COURSE_TITLE = "Fundamentals of Data Annotation & Evaluation Rubrics";

// Ordered list of presentation modules: [{ title, slides: [{ title, content }] }]
// Parsed by lib/courses.ts (content -> body, type inferred as "text").
export const rubricCourseModules = [
  {
    title: "Foundations of Rubrics",
    slides: [
      {
        title: "Intro to Rubrics",
        content:
          "A fundamental introduction to rubrics, a kind of post-training data that Deccan AI frequently provides to its clients. The principles of crafting good rubrics are rooted in how they're used to improve the LLMs you interact with every day.",
      },
      {
        title: "The Core Idea",
        content:
          "A rubric is a checklist of criteria attached to a prompt.\n\n1. Start with a prompt: A data annotator begins with the prompt they want the model to answer well.\n2. Imagine the ideal response: They picture what a perfect answer to that prompt would actually look like.\n3. Break it into criteria: Finally, they split the features of that ideal response into a set of criteria.",
      },
      {
        title: "Two ways to picture a rubric",
        content:
          "The 'grading rubric' metaphor: You might remember rubrics from writing essays in school. In AI, rubrics help distinguish better from worse responses to more open-ended prompts.\n\nThe 'recipe' metaphor: Think of a rubric as a recipe for an ideal response: a comprehensive checklist of everything the model needs for the perfect answer.",
      },
    ],
  },
  {
    title: "Anatomy of a Rubric",
    slides: [
      {
        title: "Make it MECE",
        content:
          "For a model to learn well, a rubric must be structured very specifically: a set of criteria that are mutually exclusive (no overlap) and collectively exhaustive (together they fully define the ideal response). MECE is achieved with three principles: Atomicity, Specificity, and Self-containment.",
      },
      {
        title: "Atomicity",
        content:
          "Each rubric criterion should evaluate exactly one distinct aspect. Most stacked criteria with the word 'and' can be broken into multiple pieces.",
      },
      {
        title: "Specificity & Self-Containment",
        content:
          "Specificity: Criteria should state precisely what is expected and be binary (true/false).\n\nSelf-Containment: Each criterion should contain all the information needed to evaluate a response, and be verifiable without external research.",
      },
    ],
  },
  {
    title: "Dimensions, Instructions, and Weighting",
    slides: [
      {
        title: "Understanding rubric dimensions",
        content:
          "Dimensions are simply different aspects of an ideal response. Common dimensions include:\n- Accuracy / Factuality\n- Completeness\n- Instruction Following\n- Context Awareness\n- Communication Quality",
      },
      {
        title: "Explicit and implicit criteria",
        content:
          "Explicit: What the prompt stated directly (e.g., 'a recipe for 20 kids with no nuts').\n\nImplicit: Expectations you didn't state but still have. Not saying them doesn't make them unimportant.",
      },
      {
        title: "Some criteria matter more than others",
        content:
          "Weights reflect absolute necessities, important stuff, and nice-to-haves.\n- Mandatory: E.g., omitting chocolate chips means it isn't a chocolate chip cookie.\n- Valuable: Vanilla or salt matter to flavor.\n- Nice-to-have: A shake of sea salt on top adds flair.",
      },
    ],
  },
];

export async function seedRubricCourse(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const data = {
      modules: rubricCourseModules,
      steps: rubricCourseModules.length,
    };

    const course = await prisma.course.upsert({
      where: { title: RUBRIC_COURSE_TITLE },
      update: data,
      create: {
        title: RUBRIC_COURSE_TITLE,
        category: "LEARNING PATH",
        description:
          "Master the core guidelines, consistency checks, and quality metrics required by top-tier AI labs for accurate dataset labeling.",
        duration: "45 min",
        skills: ["Data Annotation", "Quality Evaluation", "Rubric Compliance", "NLP"],
        published: true,
        ...data,
      },
    });

    const slideCount = rubricCourseModules.reduce(
      (total, mod) => total + mod.slides.length,
      0
    );
    console.log(
      `[seed-courses] "${course.title}" -> ${rubricCourseModules.length} modules, ${slideCount} slides (steps: ${course.steps})`
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Runs only when this file is the process entry point, so importing it from
// `prisma/courseContent.ts` (e.g. via `npx prisma db seed`) never re-seeds.
const invokedDirectly =
  (typeof require !== "undefined" && require.main === module) ||
  (process.argv[1] ?? "").replace(/\\/g, "/").includes("scripts/seed-courses");

if (invokedDirectly) {
  seedRubricCourse().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
