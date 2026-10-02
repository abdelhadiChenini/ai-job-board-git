import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Covers the AI CV builder's two load-bearing pieces.
 *
 * `parseCvCompletion` is the boundary between an unpredictable model and the
 * page that renders its output. A completion that is truncated mid-object is the
 * common failure, and it must surface as a clean retry rather than as a CV with
 * empty sections that looks like the product is broken — hence the weight on
 * malformed input here.
 *
 * The route tests pin one property above all others: a non-Pro request must be
 * rejected *before* the model is called. Asserting the status code alone would
 * still pass if the spend happened first, so those cases assert the call count.
 */

const USER_ID = "user-1";
const RATE_LIMIT_MS = 15 * 1000;

const VALID_PAYLOAD = {
  targetRole: "Senior Machine Learning Engineer",
  personalInfo: { fullName: "Ada Lovelace", email: "ada@example.com" },
  skills: "Python, PyTorch",
  rawExperience:
    "Three years at Acme building LLM evaluation tooling in Python. Cut inference cost by 40%. Led two engineers.",
};

type UserRow = {
  id: string;
  plan: string | null;
  role: string | null;
  lastAIGeneration: Date | null;
};

const state = {
  completions: [] as unknown[],
  reply: null as string | null,
  failure: null as Error | null,
  updates: 0,
};

vi.mock("openai", () => ({
  default: class {
    chat = {
      completions: {
        create: async (payload: unknown) => {
          state.completions.push(payload);

          if (state.failure) {
            throw state.failure;
          }

          return { choices: [{ message: { content: state.reply } }] };
        },
      },
    };
  },
}));

function seedUser(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: USER_ID,
    plan: "PRO",
    role: "EXPERT",
    lastAIGeneration: null,
    ...overrides,
  };
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  state.completions = [];
  state.reply = JSON.stringify({
    summary: "ML engineer focused on evaluation.",
    skills: ["Python", "PyTorch"],
    experience: [
      {
        title: "ML Engineer",
        company: "Acme",
        duration: "2021 - 2024",
        achievements: ["Cut inference cost by 40%."],
      },
    ],
    education: [{ degree: "MSc CS", institution: "Cambridge", year: "2021" }],
  });
  state.failure = null;
  state.updates = 0;
  process.env.OPENAI_API_KEY = "test-key";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("next-auth");
  vi.doUnmock("@/lib/prisma");
  // Deliberately no `doUnmock("openai")`: the openai mock is hoisted and
  // permanent, and unregistering it would silently point later tests at the real
  // SDK.
  process.env = { ...ORIGINAL_ENV };
});

async function post(payload: unknown, user: UserRow | null = seedUser()) {
  vi.doMock("next-auth", () => ({
    getServerSession: async () => (user ? { user: { id: user.id } } : null),
  }));

  vi.doMock("@/lib/prisma", () => ({
    prisma: {
      user: {
        findUnique: async () => user,
        update: async () => {
          state.updates += 1;
          return {};
        },
      },
    },
  }));

  const { POST } = await import("@/app/api/cv/route");

  return POST(
    new NextRequest("https://example.com/api/cv", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

describe("parseCvCompletion", () => {
  async function parse(raw: string | null) {
    const { parseCvCompletion } = await import("@/lib/cv");
    return parseCvCompletion(raw);
  }

  it("parses a well-formed completion", async () => {
    const result = await parse(
      JSON.stringify({
        summary: "ML engineer.",
        skills: ["Python"],
        experience: [{ title: "ML Engineer", company: "Acme", duration: "2021-2024", achievements: ["Did a thing."] }],
        education: [{ degree: "MSc", institution: "Cambridge", year: "2021" }],
      }),
    );

    expect(result).toEqual({
      summary: "ML engineer.",
      skills: ["Python"],
      experience: [
        { title: "ML Engineer", company: "Acme", duration: "2021-2024", achievements: ["Did a thing."] },
      ],
      education: [{ degree: "MSc", institution: "Cambridge", year: "2021" }],
    });
  });

  it("unwraps a markdown code fence", async () => {
    // `response_format` makes this unlikely, but a fence is the single most
    // common reason an otherwise valid CV fails to parse.
    const result = await parse(
      '```json\n{"summary":"Fenced.","skills":["Go"],"experience":[],"education":[]}\n```',
    );

    expect(result?.summary).toBe("Fenced.");
    expect(result?.skills).toEqual(["Go"]);
  });

  it("returns null for a completion truncated mid-object", async () => {
    expect(await parse('{"summary":"Cut off","skills":["Pyt')).toBeNull();
  });

  it("returns null for non-JSON prose and for empty input", async () => {
    expect(await parse("I'm sorry, I can't help with that.")).toBeNull();
    expect(await parse("")).toBeNull();
    expect(await parse(null)).toBeNull();
  });

  it("returns null when the JSON is an array or a scalar", async () => {
    expect(await parse("[1,2,3]")).toBeNull();
    expect(await parse('"just a string"')).toBeNull();
  });

  it("drops entries that carry no role and coerces non-strings away", async () => {
    // The renderer keys on these fields, so a null or a stray number has to be
    // removed here rather than reaching a React child as a type error.
    const result = await parse(
      JSON.stringify({
        summary: 42,
        skills: ["Python", null, 7, "  Go  ", ""],
        experience: [
          { title: "ML Engineer", company: "Acme", achievements: ["A"] },
          { title: "", company: "" },
          "not an object",
        ],
        education: [{ degree: "MSc", institution: "Cambridge" }],
      }),
    );

    expect(result?.summary).toBe("");
    expect(result?.skills).toEqual(["Python", "Go"]);
    expect(result?.experience).toHaveLength(1);
    expect(result?.experience[0].title).toBe("ML Engineer");
    expect(result?.education).toHaveLength(1);
  });

  it("keeps a missing section as an empty array", async () => {
    // Empty is honest: the prompt instructs the model to return [] rather than
    // invent a section, and the preview must render that as absent.
    const result = await parse('{"summary":"No sections."}');

    expect(result).toEqual({
      summary: "No sections.",
      skills: [],
      experience: [],
      education: [],
    });
  });
});

describe("POST /api/cv", () => {
  it("answers 401 without a session", async () => {
    const response = await post(VALID_PAYLOAD, null);

    expect(response.status).toBe(401);
    expect(state.completions).toHaveLength(0);
  });

  it("answers 403 for a FREE user without calling the model", async () => {
    const response = await post(VALID_PAYLOAD, seedUser({ plan: "FREE" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("Pro feature");
    expect(state.completions).toHaveLength(0);
    expect(state.updates).toBe(0);
  });

  it("answers 403 when the plan is missing rather than defaulting to access", async () => {
    const response = await post(VALID_PAYLOAD, seedUser({ plan: null }));

    expect(response.status).toBe(403);
    expect(state.completions).toHaveLength(0);
  });

  it("lets an ADMIN on the free plan through", async () => {
    // Staff are normally on FREE, so a gate reading `plan` alone would lock the
    // people who run the product out of their own tooling.
    const response = await post(VALID_PAYLOAD, seedUser({ plan: "FREE", role: "ADMIN" }));

    expect(response.status).toBe(200);
    expect(state.completions).toHaveLength(1);
  });

  it("generates a CV for a PRO user", async () => {
    const response = await post(VALID_PAYLOAD);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cv.summary).toBe("ML engineer focused on evaluation.");
    expect(body.cv.experience[0].company).toBe("Acme");

    // The target role must reach the system prompt, or every CV is generic.
    const sent = state.completions[0] as { messages: { role: string; content: string }[] };
    expect(sent.messages[0].content).toContain("Senior Machine Learning Engineer");
  });

  it("rejects a missing target role and too-thin experience", async () => {
    const noRole = await post({ ...VALID_PAYLOAD, targetRole: "" });
    const tooThin = await post({ ...VALID_PAYLOAD, rawExperience: "I can code." });

    expect(noRole.status).toBe(400);
    expect(tooThin.status).toBe(400);
    expect(state.completions).toHaveLength(0);
  });

  it("rejects a body that is not an object", async () => {
    const response = await post("just a string");

    expect(response.status).toBe(400);
  });

  it("throttles a second request inside the cooldown window", async () => {
    const recent = await post(
      VALID_PAYLOAD,
      seedUser({ lastAIGeneration: new Date(Date.now() - 1_000) }),
    );

    expect(recent.status).toBe(429);
    expect(state.completions).toHaveLength(0);
  });

  it("allows a request once the cooldown has elapsed", async () => {
    const elapsed = await post(
      VALID_PAYLOAD,
      seedUser({ lastAIGeneration: new Date(Date.now() - RATE_LIMIT_MS - 1_000) }),
    );

    expect(elapsed.status).toBe(200);
  });

  it("claims the cooldown before the model call", async () => {
    // If the stamp were written after a successful generation, two rapid clicks
    // would both read a stale value and both reach OpenAI.
    await post(VALID_PAYLOAD);

    expect(state.updates).toBe(1);
  });

  it("answers 502 when the model call throws", async () => {
    state.failure = new Error("upstream 500");

    const response = await post(VALID_PAYLOAD);

    expect(response.status).toBe(502);
  });

  it("answers 502 when the model returns unusable JSON", async () => {
    state.reply = '{"summary":"truncated';

    const response = await post(VALID_PAYLOAD);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toContain("unusable");
    expect(body.cv).toBeUndefined();
  });

  it("answers 503 when OPENAI_API_KEY is not configured", async () => {
    delete process.env.OPENAI_API_KEY;

    const response = await post(VALID_PAYLOAD);

    expect(response.status).toBe(503);
    expect(state.completions).toHaveLength(0);
  });
});
