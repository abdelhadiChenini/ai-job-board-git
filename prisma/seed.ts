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
    affiliateUrl: "https://www.turing.com/careers/ai-data-annotator?ref=ai-job-board",
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

async function seedCourses() {
  const courses = [
    {
      title: "Fundamentals of Data Annotation & Evaluation Rubrics",
      category: "LEARNING PATH",
      description: "Master the core guidelines, consistency checks, and quality metrics required by top-tier AI labs for accurate dataset labeling.",
      duration: "45 min",
      skills: ["Data Annotation", "Quality Evaluation", "Rubric Compliance", "NLP"],
      modules: [
        {
          id: "foundations-of-rubrics",
          title: "Foundations of Rubrics",
          slides: [
            {
              id: "for-title",
              type: "title",
              eyebrow: "Module 01",
              title: "Foundations of Rubrics",
              subtitle: "Why a shared scoring standard is the difference between noise and signal in human feedback.",
            },
            {
              id: "for-why",
              type: "bullets",
              heading: "Why rubrics matter",
              bullets: [
                "They turn subjective opinions into comparable, repeatable measurements.",
                "They let dozens of annotators converge on the same judgment for the same sample.",
                "They expose disagreement early — a rubric argument is cheaper than a model regression.",
                "They give model consumers a readable contract for what 'good' actually means.",
              ],
            },
            {
              id: "for-contract",
              type: "text",
              heading: "The consistency contract",
              body: "A rubric is a contract between everyone who scores the same data. It states, in advance, what each quality dimension means and how each level of quality looks in practice.\n\nWithout that contract, two annotators can both be 'right' and still disagree — and downstream, the model learns from that disagreement as if it were a real preference.",
            },
            {
              id: "for-signals",
              type: "bullets",
              heading: "Signals a rubric is working",
              bullets: [
                "Inter-annotator agreement stays stable as the team grows.",
                "Disputes are resolved by pointing at descriptors, not by seniority.",
                "Edge cases get added to the rubric instead of being silently forced.",
                "Reviewers spend time on genuinely ambiguous samples only.",
              ],
            },
          ],
        },
        {
          id: "anatomy-of-a-rubric",
          title: "Anatomy of a Rubric",
          slides: [
            {
              id: "ana-title",
              type: "title",
              eyebrow: "Module 02",
              title: "Anatomy of a Rubric",
              subtitle: "The four parts every scoring guide is built from — and how they fit together.",
            },
            {
              id: "ana-parts",
              type: "bullets",
              heading: "The four building blocks",
              bullets: [
                "Criteria: the single dimension being judged, such as accuracy or tone.",
                "Descriptors: plain-language statements of what each level looks like.",
                "Rating levels: the ordered scale, typically 1–4 or 1–5.",
                "Anchors: real, reviewed examples pinned to each level.",
              ],
            },
            {
              id: "ana-criteria",
              type: "text",
              heading: "Criteria versus indicators",
              body: "A criterion answers 'what are we judging?' — factual accuracy, instruction-following, safety. An indicator answers 'how would I notice it?' — the observable behaviours that justify moving a score up or down.\n\nGood rubrics keep those separate. Indicators are written as things a reviewer can verify in the sample, never as intentions the annotator has to guess at.",
            },
            {
              id: "ana-levels",
              type: "bullets",
              heading: "Designing levels that hold up",
              bullets: [
                "Use an even number of levels when you want to force a decision instead of a hedge.",
                "Write the top and bottom levels first — they define the range.",
                "Make every level distinguishable on a single axis, never a blend of qualities.",
                "Kill the 'average' middle unless it has a concrete anchor example.",
              ],
            },
          ],
        },
        {
          id: "dimensions-instructions-weighting",
          title: "Dimensions, Instructions, and Weighting",
          slides: [
            {
              id: "diw-title",
              type: "title",
              eyebrow: "Module 03",
              title: "Dimensions, Instructions, and Weighting",
              subtitle: "Choosing what to measure, writing instructions that remove ambiguity, and deciding what counts more.",
            },
            {
              id: "diw-dimensions",
              type: "bullets",
              heading: "Choosing dimensions",
              bullets: [
                "Accuracy and faithfulness to the source — non-negotiable for factual tasks.",
                "Instruction-following — did the response do exactly what was asked?",
                "Completeness — are required points present without padding?",
                "Tone and safety — style rules and boundary adherence.",
              ],
            },
            {
              id: "diw-instructions",
              type: "text",
              heading: "Instructions that remove ambiguity",
              body: "Write instructions as decision rules, not advice. 'Be concise' is advice; 'flag any response over 200 words unless the user asked for detail' is a rule a reviewer can apply without asking anyone.\n\nEvery instruction should be answerable with yes or no from the sample alone. If answering it requires guessing intent, it belongs in the guidelines — not the rubric.",
            },
            {
              id: "diw-weighting",
              type: "bullets",
              heading: "Weighting with intent",
              bullets: [
                "Weight by failure cost: safety and factual errors outweigh stylistic polish.",
                "Keep weights simple — two or three tiers beat a dozen fractional values.",
                "Document the composite formula so scores are reproducible.",
                "Rebalance whenever the product's risk profile changes, and version the rubric.",
              ],
            },
          ],
        },
      ],
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
    const existing = await prisma.course.findFirst({ where: { title: c.title } });
    if (existing) {
      await prisma.course.update({ where: { id: existing.id }, data });
    } else {
      await prisma.course.create({ data });
    }
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

  await prisma.jobOffer.deleteMany();

  for (const job of jobSeeds) {
    await prisma.jobOffer.create({
      data: {
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
      },
    });
  }
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
