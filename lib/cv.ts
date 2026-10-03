import OpenAI from "openai";

/**
 * AI CV generation.
 *
 * The model is treated as an untrusted source of data, never as one to be
 * believed. It is asked for strict JSON, and then everything it returns is
 * re-validated field by field before it can reach the browser — a completion
 * that is truncated mid-object, wrapped in a code fence, or missing `summary`
 * must degrade to a clean "regenerate" rather than render an empty CV that looks
 * like the user's fault. `parseCvCompletion` is where that contract lives.
 */

export const CV_MODEL = "gpt-4o-mini";

/** Ceiling on a single generation, in tokens. A CV needs room; a CV does not need an essay. */
const MAX_TOKENS = 2000;

export type CvPersonalInfo = {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
};

export type CvExperienceEntry = {
  title: string;
  company: string;
  duration: string;
  achievements: string[];
};

export type CvEducationEntry = {
  degree: string;
  institution: string;
  year: string;
};

/** The shape the UI renders. Every field is a definite type after parsing. */
export type CvDocument = {
  summary: string;
  skills: string[];
  experience: CvExperienceEntry[];
  education: CvEducationEntry[];
  languages?: string[];
};

/** What the browser sends. Every field is a plain string — no nested objects. */
export type CvRequestInput = {
  targetRole: string;
  personalInfo: CvPersonalInfo;
  skills: string;
  rawExperience: string;
  education?: string;
  languages?: string;
};

export const CV_MIN_RAW_EXPERIENCE = 40;

export function buildCvSystemPrompt(targetRole: string): string {
  return (
    "You are an expert tech recruiter. Take the user's raw experience and format it " +
    `into a highly professional CV tailored for the role of ${targetRole}. ` +
    "Return strictly in JSON format matching this structure: " +
    '{ "summary": "", "skills": [], "experience": [{ "title": "", "company": "", "duration": "", "achievements": [""] }], "education": [{ "degree": "", "institution": "", "year": "" }], "languages": [""] }. ' +
    "Rules: rewrite the user's own experience, never invent employers, job titles, " +
    "degrees or dates they did not supply; quantify outcomes only where the user gave " +
    "a number; keep achievements as short action-led bullets; order skills by relevance " +
    "to the target role; use an empty array for any section the user gave no material " +
    "for rather than fabricating one. Output JSON only, with no code fences and no " +
    "prose before or after it."
  );
}

/** Trims a string field, coercing anything non-string to "". */
function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Keeps only non-empty strings, so a stray `null` or number cannot reach the UI. */
function textList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(text).filter((entry) => entry.length > 0);
}

/**
 * Normalises one untrusted object into a `CvExperienceEntry`.
 *
 * `achievements` is flattened to a list whether the model returned it as an
 * array or a single string, because models reliably disagree about that one.
 */
function toExperienceEntry(value: unknown): CvExperienceEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Record<string, unknown>;
  const title = text(entry.title);
  const company = text(entry.company);

  // An entry with neither a title nor a company is not a role; dropping it keeps
  // the preview free of blank-headed sections.
  if (!title && !company) {
    return null;
  }

  return {
    title,
    company,
    duration: text(entry.duration),
    achievements: textList(entry.achievements),
  };
}

function toEducationEntry(value: unknown): CvEducationEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Record<string, unknown>;
  const degree = text(entry.degree);
  const institution = text(entry.institution);

  if (!degree && !institution) {
    return null;
  }

  return {
    degree,
    institution,
    year: text(entry.year),
  };
}

/**
 * Strips a markdown fence if the model wrapped its JSON in one.
 *
 * `response_format: json_object` makes fences unlikely but not impossible, and a
 * fence is the single most common reason an otherwise valid CV fails to parse.
 */
function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);

  return fenced ? fenced[1] : trimmed;
}

/**
 * Parses a model completion into a `CvDocument`, or returns `null`.
 *
 * Returning `null` rather than throwing keeps the caller simple: there is no
 * partial credit here, because a half-built CV is worse than an honest retry.
 */
export function parseCvCompletion(raw: string | null | undefined): CvDocument | null {
  if (!raw) {
    return null;
  }

  const candidate = stripCodeFence(raw);

  if (!candidate) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(candidate);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  return {
    summary: text(record.summary),
    skills: textList(record.skills),
    experience: Array.isArray(record.experience)
      ? record.experience.map(toExperienceEntry).filter((entry): entry is CvExperienceEntry => entry !== null)
      : [],
    education: Array.isArray(record.education)
      ? record.education.map(toEducationEntry).filter((entry): entry is CvEducationEntry => entry !== null)
      : [],
    languages: Array.isArray(record.languages)
      ? record.languages.map(text).filter((entry) => entry.length > 0)
      : typeof record.languages === "string"
      ? text(record.languages)
          .split(/[,;|]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : undefined,
  };
}

/**
 * Calls OpenAI and returns a validated CV.
 *
 * Throws on transport or configuration failure so the route can map it to a
 * status; returns `null` when the model replied with something unusable, which
 * is a different problem and gets a different message for the user.
 */
export async function generateCv(input: CvRequestInput): Promise<CvDocument | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: CV_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildCvSystemPrompt(input.targetRole) },
      {
        role: "user",
        content: [
          `Target role: ${input.targetRole}`,
          `Name: ${input.personalInfo.fullName}`,
          `Email: ${input.personalInfo.email}`,
          input.personalInfo.phone ? `Phone: ${input.personalInfo.phone}` : "",
          input.personalInfo.location ? `Location: ${input.personalInfo.location}` : "",
          input.personalInfo.website ? `Website: ${input.personalInfo.website}` : "",
          input.personalInfo.linkedin ? `LinkedIn: ${input.personalInfo.linkedin}` : "",
          input.personalInfo.github ? `GitHub: ${input.personalInfo.github}` : "",
          `Existing skills: ${input.skills}`,
          input.education ? `Education: ${input.education}` : "",
          input.languages ? `Languages: ${input.languages}` : "",
          "",
          "My raw experience and background:",
          input.rawExperience,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
    temperature: 0.7,
    max_tokens: MAX_TOKENS,
  });

  return parseCvCompletion(completion.choices[0]?.message?.content);
}