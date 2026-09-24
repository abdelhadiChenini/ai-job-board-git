import { PrismaClient } from "@prisma/client";

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
  platformSlug: string;
  title: string;
  labName: string;
  description: string;
  tags: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  badge?: string;
  // Sample placeholders — swap in real affiliate links before launch.
  affiliateUrl: string;
};

const jobSeeds: JobSeed[] = [
  {
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
    platformSlug: "turing",
    title: "AI Data Annotator",
    labName: "Turing",
    description:
      "Annotate multimodal datasets to support fine-tuning of generative AI products across text, image and code.",
    tags: ["Data Annotation", "Multimodal", "Remote"],
    salaryMin: 20,
    salaryMax: 35,
    affiliateUrl:
      "https://www.turing.com/careers/ai-data-annotator?ref=ai-job-board",
  },
  {
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

  await prisma.jobOffer.deleteMany();

  for (const job of jobSeeds) {
    await prisma.jobOffer.create({
      data: {
        title: job.title,
        description: job.description,
        aiLabName: job.labName,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.currency ?? "USD",
        tags: job.tags,
        badge: job.badge ?? null,
        affiliateUrl: job.affiliateUrl,
        platform: { connect: { slug: job.platformSlug } },
      },
    });
  }

  console.log(
    `Seeded ${platformData.length} AI platforms and ${jobSeeds.length} job offers.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });