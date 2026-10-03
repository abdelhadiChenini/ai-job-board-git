import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";
import { CV_MIN_RAW_EXPERIENCE, generateCv, type CvRequestInput } from "@/lib/cv";

/**
 * Shared cooldown, in milliseconds, between two generations.
 *
 * Reuses `lastAIGeneration`, the same column the admin assistant writes, because
 * it is the only throttle column that exists and both surfaces call the same
 * paid model. The tradeoff is deliberate: an admin generating a blog post can
 * delay their own CV by up to this window. Keeping one throttle beats adding a
 * second column for a fifteen-second gap, and nobody notices a fifteen-second
 * wait on a button they just pressed.
 */
const RATE_LIMIT_MS = 15 * 1000;

const MAX_FIELD_LENGTH = 4000;

const CV_FORBIDDEN_MESSAGE =
  "The AI CV Builder is a Pro feature. Upgrade to unlock it.";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Clamps free-text input so one enormous textarea cannot become a huge prompt. */
function clamp(value: string): string {
  return value.slice(0, MAX_FIELD_LENGTH);
}

/**
 * Reads and validates the request body.
 *
 * Returns a discriminated result rather than throwing so the route can answer
 * 400 without catching its own mistakes.
 */
function readInput(
  body: unknown,
): { ok: true; input: CvRequestInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }

  const record = body as Record<string, unknown>;
  const personal = (
    record.personalInfo && typeof record.personalInfo === "object"
      ? record.personalInfo
      : {}
  ) as Record<string, unknown>;

  const targetRole = clamp(str(record.targetRole));
  const skills = clamp(str(record.skills));
  const education = clamp(str(record.education));
  const languages = clamp(str(record.languages));
  const certifications = clamp(str(record.certifications));
  const rawExperience = clamp(str(record.rawExperience));
  const fullName = clamp(str(personal.fullName));
  const email = clamp(str(personal.email));

  if (!targetRole) {
    return { ok: false, error: "A target role is required." };
  }

  if (!fullName) {
    return { ok: false, error: "Your name is required." };
  }

  if (!email) {
    return { ok: false, error: "Your email is required." };
  }

  // Below the floor there is nothing for the model to reshape, and a CV built
  // from two words would read as a broken product rather than a thin input.
  if (rawExperience.length < CV_MIN_RAW_EXPERIENCE) {
    return {
      ok: false,
      error: `Please describe your experience in a little more detail — at least ${CV_MIN_RAW_EXPERIENCE} characters.`,
    };
  }

  return {
    ok: true,
    input: {
      targetRole,
      skills,
      education: education || undefined,
      languages: languages || undefined,
      certifications: certifications || undefined,
      rawExperience,
      personalInfo: {
        fullName,
        email,
        phone: clamp(str(personal.phone)),
        location: clamp(str(personal.location)),
        website: clamp(str(personal.website)),
        linkedin: clamp(str(personal.linkedin)),
        github: clamp(str(personal.github)),
      },
    },
  };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, role: true, lastAIGeneration: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // Admins bypass the paywall for the same reason they bypass the apply limits:
  // `plan` describes their subscription, not their access to the product.
  if (user.role !== "ADMIN" && normalizePlan(user.plan) !== "PRO") {
    return NextResponse.json({ error: CV_FORBIDDEN_MESSAGE }, { status: 403 });
  }

  if (user.lastAIGeneration) {
    const elapsed = Date.now() - user.lastAIGeneration.getTime();

    if (elapsed < RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);

      return NextResponse.json(
        {
          error: `Please wait ${waitSeconds} more second${waitSeconds === 1 ? "" : "s"} before generating again.`,
        },
        { status: 429 },
      );
    }
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = readInput(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "The CV builder is not configured yet. Please try again soon." },
      { status: 503 },
    );
  }

  // Claim the window before the call, not after: two rapid clicks would both
  // read the same stale timestamp and both reach OpenAI.
  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastAIGeneration: new Date() },
  });

  try {
    const cv = await generateCv(parsed.input);

    if (!cv) {
      return NextResponse.json(
        {
          error:
            "The AI returned an unusable response. Please try generating again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ cv });
  } catch (error) {
    console.error("CV generation failed:", error);

    return NextResponse.json(
      { error: "CV generation failed. Please try again." },
      { status: 502 },
    );
  }
}