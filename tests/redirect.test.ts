import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createFakePrisma, type FakeJob, type FakeUser } from "./helpers/fakePrisma";

/**
 * Covers `/api/redirect`, the outbound hop to the employer's application page.
 *
 * This route is the easiest way to walk straight past the early-access gate, so
 * the cases that matter are the ones proving it cannot: a locked role must not
 * hand a Free user (or a logged-out visitor) the external application page, while
 * Pro members, admins and everyone applying to an older role go straight through.
 *
 * The anonymous cases are pinned deliberately. "Let signed-out visitors through"
 * looked harmless once — they have no plan to gate — but it left the only
 * unguarded route to a Pro-exclusive role: stay logged out and apply freely.
 */

const HOUR_MS = 60 * 60 * 1000;
const USER_ID = "user-1";
/** Must satisfy the route's UUID guard, so it cannot be a readable stub. */
const JOB_ID = "11111111-2222-3333-4444-555555555555";
const AFFILIATE = "https://boards.example.com/roles/42";

function seedUser(overrides: Partial<FakeUser> = {}): FakeUser {
  return {
    id: USER_ID,
    email: "candidate@example.com",
    plan: "FREE",
    role: "EXPERT",
    paypalSubscriptionId: null,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function seedJob(overrides: Partial<FakeJob> = {}): FakeJob {
  return {
    id: JOB_ID,
    affiliateUrl: AFFILIATE,
    slug: "senml-engineer",
    datePosted: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}

const fresh = () => seedJob({ datePosted: new Date() });
const aged = () => seedJob({ datePosted: new Date(Date.now() - 49 * HOUR_MS) });

/**
 * An unlocked role carrying a given destination URL.
 *
 * Unlocked on purpose: a locked role is diverted to the login redirect (or 403)
 * before `redirectToAffiliate` ever runs, which would assert the wrong branch.
 */
const withUrl = (affiliateUrl: string) =>
  seedJob({ affiliateUrl, datePosted: new Date(Date.now() - 49 * HOUR_MS) });

/**
 * Dispatches the real route handler with the given fixtures.
 *
 * The request is built through `NextRequest` because the handler reads
 * `request.nextUrl` and re-uses `request.url` to build the login redirect, so a
 * plain `Request` would not exercise the same path Next does.
 */
async function hit(
  jobs: FakeJob[],
  signedInAs: FakeUser | null,
  query = `id=${JOB_ID}`,
) {
  const db = createFakePrisma(signedInAs ? [signedInAs] : [], jobs);
  const sessionUser = signedInAs
    ? { id: signedInAs.id, role: signedInAs.role ?? "EXPERT" }
    : null;

  vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));
  vi.doMock("next-auth", () => ({
    getServerSession: async () => (sessionUser ? { user: sessionUser } : null),
  }));

  const { GET } = await import("@/app/api/redirect/route");
  return GET(new NextRequest(`https://example.com/api/redirect?${query}`));
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/prisma");
  vi.doUnmock("next-auth");
});

describe("signed-in users", () => {
  it("forbids a FREE user from a role inside the window", async () => {
    const response = await hit([fresh()], seedUser());

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe(
      "This opportunity is exclusively available to Pro members for the first 48 hours.",
    );
  });

  it("lets a PRO user through for a brand-new role", async () => {
    const response = await hit([fresh()], seedUser({ plan: "PRO" }));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(AFFILIATE);
  });

  it("lets an ADMIN on the FREE plan through for a brand-new role", async () => {
    const response = await hit([fresh()], seedUser({ plan: "FREE", role: "ADMIN" }));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(AFFILIATE);
  });

  it("lets a FREE user through once the window has elapsed", async () => {
    const response = await hit([aged()], seedUser());

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(AFFILIATE);
  });

  it("uses the createdAt fallback when datePosted is missing", async () => {
    const response = await hit(
      [seedJob({ datePosted: null, createdAt: new Date() })],
      seedUser(),
    );

    expect(response.status).toBe(403);
  });
});

describe("anonymous visitors", () => {
  it("is sent to log in instead of being handed a locked role", async () => {
    const response = await hit([fresh()], null);

    expect(response.status).toBe(302);

    const location = new URL(response.headers.get("location")!);
    expect(location.origin).toBe("https://example.com");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe(
      "/opportunities/senml-engineer",
    );
  });

  it("still forwards an older role so browsing stays open", async () => {
    const response = await hit([aged()], null);

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(AFFILIATE);
  });

  it("degrades to the listing when the role has no slug", async () => {
    const response = await hit([fresh(), seedJob({ slug: "" })], null);

    // Two fixtures share one id, so the seeded map collapses to the second.
    expect(response.status).toBe(302);
    expect(
      new URL(response.headers.get("location")!).searchParams.get("callbackUrl"),
    ).toBe("/opportunities");
  });
});

describe("malformed affiliate urls", () => {
  it("returns 400 instead of throwing on an unparseable url", async () => {
    const response = await hit([withUrl("not a url")], null);

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Invalid destination URL");
  });

  it("returns 400 for a non-http scheme", async () => {
    const response = await hit([withUrl("javascript:alert(1)")], null);

    expect(response.status).toBe(400);
  });

  it("returns 400 for a signed-in user too, rather than a 500", async () => {
    const response = await hit([withUrl("http://")], seedUser());

    expect(response.status).toBe(400);
  });

  it("returns 400 for an empty destination", async () => {
    const response = await hit([withUrl("")], seedUser());

    expect(response.status).toBe(400);
  });
});

describe("bad input", () => {
  it("rejects a non-uuid id before touching the database", async () => {
    const response = await hit([fresh()], null, "id=../../etc/passwd");

    expect(response.status).toBe(400);
  });

  it("rejects a missing id", async () => {
    const response = await hit([fresh()], null, "");

    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    const response = await hit([], seedUser());

    expect(response.status).toBe(404);
  });
});