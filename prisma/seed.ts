import { PrismaClient } from "@prisma/client";
import { rubricCourseModules } from "./courseContent";

const prisma = new PrismaClient();

const platformData = [
  {
    slug: "turing",
    name: "Turing",
    websiteUrl: "https://www.turing.com",
    description:
      "Global platform for remote AI engineering, data labeling and LLM evaluation talent.",
  },
  {
    slug: "rws",
    name: "RWS",
    websiteUrl: "https://www.rws.com",
    description:
      "Language services, content management and AI training data specialists.",
  },
  {
    slug: "scale-ai",
    name: "Scale AI",
    websiteUrl: "https://scale.ai",
    description:
      "Data platform that accelerates frontier-model training, evals and RLHF workflows.",
  },
];

type JobSeed = {
  slug: string;
  platformSlug: string;
  title: string;
  labName: string;
  description: string;
  tags: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  badge?: string;
  affiliateUrl: string;
};

const jobSeeds: JobSeed[] = [
  {
    slug: "llm-evaluator",
    platformSlug: "turing",
    title: "LLM Evaluator",
    labName: "Turing",
    description:
      "Assess and score model responses on quality, safety and instruction-following; write structured rubrics to drive model improvements.",
    tags: ["LLMs", "Evaluation", "Remote", "Prompting"],
    salaryMin: 25,
    salaryMax: 40,
    badge: "New",
    affiliateUrl: "https://www.turing.com/careers/llm-evaluator?ref=ai-job-board",
  },
  {
    slug: "ai-data-annotator-turing",
    platformSlug: "turing",
    title: "AI Data Annotator",
    labName: "Turing",
    description:
      "Annotate multimodal datasets to support fine-tuning of generative AI products across text, image and code.",
    tags: ["Data Annotation", "Multimodal", "Remote"],
    salaryMin: 20,
    salaryMax: 35,
    affiliateUrl: "https://www.turing.com/careers/ai-data-annotator?ref=ai-job-board",
  },
  {
    slug: "ai-data-annotator",
    platformSlug: "rws",
    title: "AI Data Annotator",
    labName: "RWS",
    description:
      "Label and refine linguistic training data to improve machine translation quality and model fluency.",
    tags: ["Data Annotation", "NLP", "Linguistics"],
    salaryMin: 22,
    salaryMax: 38,
    affiliateUrl: "https://www.rws.com/careers/ai-data-annotator?ref=ai-job-board",
  },
  {
    slug: "prompt-linguist",
    platformSlug: "rws",
    title: "Prompt Linguist",
    labName: "RWS",
    description:
      "Craft and audit prompts across languages and locales for LLM-based localization products.",
    tags: ["LLMs", "Prompting", "Linguistics"],
    salaryMin: 28,
    salaryMax: 45,
    affiliateUrl: "https://www.rws.com/careers/prompt-linguist?ref=ai-job-board",
  },
  {
    slug: "genai-evaluation-specialist",
    platformSlug: "scale-ai",
    title: "GenAI Evaluation Specialist",
    labName: "Scale AI",
    description:
      "Evaluate agentic model outputs, author quality rubrics, and quality-control large-scale evals for frontier labs.",
    tags: ["Evaluation", "Agentic AI", "Remote"],
    salaryMin: 30,
    salaryMax: 50,
    badge: "Trending",
    affiliateUrl: "https://scale.ai/join/genai-eval?ref=ai-job-board",
  },
];

async function seedCourses() {
  const courses = [
    {
      title: "Fundamentals of Data Annotation & Evaluation Rubrics",
      category: "LEARNING PATH",
      description: "Master the core guidelines, consistency checks, and quality metrics required by top-tier AI labs for accurate dataset labeling.",
      duration: "45 min",
      skills: ["Data Annotation", "Quality Evaluation", "Rubric Compliance", "NLP"],
      modules: rubricCourseModules,
      published: true,
    },
    {
      title: "Prompt Engineering & LLM Output Direction",
      category: "LEARNING PATH",
      description: "Learn advanced techniques for structuring system prompts, chaining thoughts, and mitigating hallucinations in frontier models.",
      duration: "50 min",
      skills: ["Prompt Engineering", "LLM Alignment", "Chain-of-Thought", "Output Control"],
      modules: [
        {
          id: "prompt-structure-fundamentals",
          title: "Prompt Structure Fundamentals",
          slides: [
            {
              id: "psf-title",
              type: "title",
              eyebrow: "Module 01",
              title: "Prompt Structure Fundamentals",
              subtitle: "Role, context, task, constraints, and format — the skeleton of every reliable prompt.",
            },
            {
              id: "psf-blocks",
              type: "bullets",
              heading: "The five blocks of a prompt",
              bullets: [
                "Role: who the model is acting as and what expertise that implies.",
                "Context: the background facts it may rely on, quoted rather than paraphrased.",
                "Task: one unambiguous instruction with a clear success condition.",
                "Constraints: what to avoid, cut, or never invent.",
                "Format: the exact shape of the answer — schema, length, headings.",
              ],
            },
            {
              id: "psf-order",
              type: "text",
              heading: "Order matters more than words",
              body: "Models weight recent and structurally distinct instructions heavily. Put the task after the context and the format at the end, so the last thing the model reads is how to output the answer.\n\nWhen a prompt fails, reorder before rewriting. Most 'prompt bugs' are actually precedence bugs — two instructions competing, with the wrong one winning.",
            },
          ],
        },
        {
          id: "chain-of-thought-reasoning",
          title: "Chain-of-Thought & Reasoning",
          slides: [
            {
              id: "cot-title",
              type: "title",
              eyebrow: "Module 02",
              title: "Chain-of-Thought & Reasoning",
              subtitle: "When to ask for intermediate steps — and when reasoning out loud makes answers worse.",
            },
            {
              id: "cot-when",
              type: "bullets",
              heading: "Reach for reasoning when…",
              bullets: [
                "The task has multiple dependent steps: arithmetic, planning, transformation.",
                "The answer must be justified, so reviewers can audit the path taken.",
                "Errors are cheap to catch mid-chain but expensive to catch in the final answer.",
                "The model is choosing between options with trade-offs.",
              ],
            },
            {
              id: "cot-shape",
              type: "text",
              heading: "Shape the reasoning, don't just request it",
              body: "'Think step by step' is a starting point, not a design. Specifying the stages — restate the problem, list assumptions, evaluate options, conclude — produces shorter, more checkable chains and reduces confident nonsense.\n\nFor production, prefer structured sections over free-form rambling; you can validate sections, you cannot validate a monologue.",
            },
          ],
        },
        {
          id: "guardrails-output-control",
          title: "Guardrails and Output Control",
          slides: [
            {
              id: "goc-title",
              type: "title",
              eyebrow: "Module 03",
              title: "Guardrails and Output Control",
              subtitle: "Constraining the response so downstream systems can trust it.",
            },
            {
              id: "goc-tactics",
              type: "bullets",
              heading: "Control tactics that hold",
              bullets: [
                "Define the schema first: keys, types, allowed values, and what 'null' means.",
                "Name the failure mode: 'if unsure, return { … }' instead of a guess.",
                "Give a fixed vocabulary for labels rather than open-ended generation.",
                "Ask for a short rationale field so you can audit decisions later.",
              ],
            },
            {
              id: "goc-hallucination",
              type: "text",
              heading: "Mitigating hallucination in practice",
              body: "Hallucination is usually an instruction problem: the prompt asks for an answer when the honest response is 'not in the source.' Fix that by making citation or abstention part of the required output, not a footnote.\n\nPair the prompt with a validation step — schema check, lookup check, arithmetic check — because no wording alone guarantees a truthful model.",
            },
          ],
        },
      ],
      published: true,
    },
    {
      title: "RLHF & Preference Ranking Best Practices",
      category: "PLAYGROUND",
      description: "Interactive practice modules on evaluating conversational tone, safety boundaries, and human-in-the-loop ranking preferences.",
      duration: "30 min",
      skills: ["RLHF", "Safety Alignment", "Preference Ranking", "Model Fine-tuning"],
      modules: [
        {
          id: "preference-data-collection",
          title: "Preference Data Collection",
          slides: [
            {
              id: "pdc-title",
              type: "title",
              eyebrow: "Module 01",
              title: "Preference Data Collection",
              subtitle: "Gathering pairwise judgments that actually reflect what you want the model to do.",
            },
            {
              id: "pdc-pairs",
              type: "bullets",
              heading: "What makes a good pair",
              bullets: [
                "Both responses should be plausible — comparing gold to garbage teaches nothing.",
                "Sample pairs where the model is genuinely uncertain for the highest signal.",
                "Keep the prompt fixed across a pair; only the responses vary.",
                "Capture the reason for the preference, not just the winner.",
              ],
            },
            {
              id: "pdc-bias",
              type: "text",
              heading: "Collection biases to watch",
              body: "Raters drift toward position bias (always picking the first response), length bias (longer reads as better), and style bias (confident tone beats correct content). Randomise order, normalise length where possible, and periodically re-insert gold pairs to measure rater accuracy.\n\nA dataset with systematic bias will align the model to your raters' habits, not your values.",
            },
          ],
        },
        {
          id: "ranking-judgments-tie-breaking",
          title: "Ranking Judgments & Tie-Breaking",
          slides: [
            {
              id: "rjt-title",
              type: "title",
              eyebrow: "Module 02",
              title: "Ranking Judgments & Tie-Breaking",
              subtitle: "How to handle ties, close calls, and multi-response rankings without inventing signal.",
            },
            {
              id: "rjt-rules",
              type: "bullets",
              heading: "Ranking rules that stay consistent",
              bullets: [
                "Allow ties explicitly — forcing a winner manufactures noise.",
                "Rank on one dimension at a time before the composite score.",
                "Use tie-break criteria in a fixed order: safety, accuracy, then style.",
                "Send dead-heat pairs to review instead of dropping them silently.",
              ],
            },
            {
              id: "rjt-scale",
              type: "text",
              heading: "From rankings to a scoring scale",
              body: "Pairwise rankings become a usable scale through aggregation: convert wins into Bradley–Terry style scores, then check that the ordering survives resampling.\n\nIf the ordering flips when you remove a few judgments, your scale is not stable yet — collect more pairs in the contested region rather than averaging harder.",
            },
          ],
        },
        {
          id: "safety-tone-human-loop",
          title: "Safety, Tone, and Human Review",
          slides: [
            {
              id: "sth-title",
              type: "title",
              eyebrow: "Module 03",
              title: "Safety, Tone, and Human Review",
              subtitle: "Balancing helpfulness with boundaries, and knowing when a human must decide.",
            },
            {
              id: "sth-boundaries",
              type: "bullets",
              heading: "Scoring safety and tone",
              bullets: [
                "Treat safety violations as vetoes, not weights — no style score offsets them.",
                "Score tone against the stated audience, not your own preference.",
                "Reward appropriate refusals that still offer a safe alternative.",
                "Separate 'blocked' from 'degraded' so escalation paths stay clear.",
              ],
            },
            {
              id: "sth-loop",
              type: "text",
              heading: "Where humans stay in the loop",
              body: "Automate the clear cases at both ends of the scale and route the contested middle to senior reviewers. That slice is where guidelines get rewritten and where the next version of the rubric comes from.\n\nTrack every human override: if overrides cluster on one rule, the rule — not the reviewer — is the problem.",
            },
          ],
        },
      ],
      published: true,
    },
  ];
  for (const c of courses) {
    const data = { ...c, steps: c.modules.length };
    await prisma.course.upsert({
      where: { title: c.title },
      update: data,
      create: data,
    });
  }
}

async function seedJobOffers() {
  const platforms = new Map(
    (await prisma.aIPlatform.findMany({ select: { id: true, slug: true } })).map((p) => [
      p.slug,
      p.id,
    ])
  );

  for (const job of jobSeeds) {
    const platformId = platforms.get(job.platformSlug);
    if (!platformId) {
      throw new Error(`Cannot seed "${job.title}": unknown platform "${job.platformSlug}"`);
    }

    // Adopt the slug of an already-live offer so the upsert updates that row
    // instead of inserting a duplicate. Legacy rows without a slug are given
    // the canonical one first, which keeps `slug` unique across the table.
    const existing = await prisma.jobOffer.findFirst({
      where: { title: job.title, platformId },
      select: { id: true, slug: true },
    });
    if (existing && !existing.slug) {
      await prisma.jobOffer.update({
        where: { id: existing.id },
        data: { slug: job.slug },
      });
    }

    const data = {
      title: job.title,
      description: job.description,
      aiLabName: job.labName,
      tags: job.tags,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency ?? "USD",
      badge: job.badge,
      affiliateUrl: job.affiliateUrl,
      platform: { connect: { slug: job.platformSlug } },
    };

    await prisma.jobOffer.upsert({
      where: { slug: existing?.slug ?? job.slug },
      update: data,
      create: { ...data, slug: job.slug },
    });
  }
}

async function main() {
  for (const platform of platformData) {
    await prisma.aIPlatform.upsert({
      where: { slug: platform.slug },
      update: {
        name: platform.name,
        websiteUrl: platform.websiteUrl,
        description: platform.description,
      },
      create: platform,
    });
  }

  await seedJobOffers();
  await seedCourses();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
