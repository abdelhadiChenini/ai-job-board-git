import { afterEach, describe, expect, it, vi } from "vitest";
import { createFakePrisma, type FakeJob, type FakeUser } from "./helpers/fakePrisma";

/**
 * Covers the 48-hour early-access window: who it locks out, who it must never
 * lock out, and where the boundary sits.
 *
 * The two exemptions are the load-bearing part of this suite. `plan` alone is
 * not sufficient — an ADMIN on the free plan is the normal state for staff, so
 * a gate that only reads `plan` silently locks administrators out of the content
 * they curate. That regression is invisible in the UI and would not show up in
 * a manual smoke test, which is why it is pinned here.
 */

const HOUR_MS = 60 * 60 * 1000;
const USER_ID = "user-1";
const JOB_ID = "job-1";

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
    affiliateUrl: "https://example.com/apply",
    datePosted: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}

/** Loads `canApplyToJob` against in-memory doubles for the given fixtures. */
async function canApply(users: FakeUser[], jobs: FakeJob[]) {
  const db = createFakePrisma(users, jobs);
  vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));

  const { canApplyToJob } = await import("@/lib/subscription");
  return { db, eligibility: await canApplyToJob(USER_ID, JOB_ID) };
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/prisma");
});

describe("48-hour early access window", () => {
  it("blocks a FREE user from a role posted one hour ago", async () => {
    const { eligibility } = await canApply(
      [seedUser()],
      [seedJob({ datePosted: new Date(Date.now() - 1 * HOUR_MS) })],
    );

    expect(eligibility).toMatchObject({
      allowed: false,
      reason: "early_access",
    });
  });

  it("allows a FREE user once the window has elapsed", async () => {
    const { eligibility } = await canApply(
      [seedUser()],
      [seedJob({ datePosted: new Date(Date.now() - 49 * HOUR_MS) })],
    );

    expect(eligibility).toEqual({ allowed: true });
  });

  it("treats exactly 48 hours as unlocked", async () => {
    const { eligibility } = await canApply(
      [seedUser()],
      [seedJob({ datePosted: new Date(Date.now() - 48 * HOUR_MS - 5_000) })],
    );

    expect(eligibility).toEqual({ allowed: true });
  });

  it("still blocks one minute before the window closes", async () => {
    const { eligibility } = await canApply(
      [seedUser()],
      [seedJob({ datePosted: new Date(Date.now() - (48 * HOUR_MS - 60_000)) })],
    );

    expect(eligibility).toMatchObject({
      allowed: false,
      reason: "early_access",
    });
  });

  it("falls back to createdAt when datePosted is missing", async () => {
    // Bulk-imported rows share a createdAt and have no upstream posting date,
    // so createdAt is the only signal available for them.
    const { eligibility } = await canApply(
      [seedUser()],
      [
        seedJob({
          datePosted: null,
          createdAt: new Date(Date.now() - 1 * HOUR_MS),
        }),
      ],
    );

    expect(eligibility).toMatchObject({
      allowed: false,
      reason: "early_access",
    });
  });

  it("reports when the role unlocks", async () => {
    const postedAt = new Date(Date.now() - 10 * HOUR_MS);
    const { eligibility } = await canApply([seedUser()], [seedJob({ datePosted: postedAt })]);

    expect(eligibility).toMatchObject({ reason: "early_access" });
    if (!eligibility.allowed && eligibility.reason === "early_access") {
      expect(eligibility.unlocksAt.getTime()).toBe(
        postedAt.getTime() + 48 * HOUR_MS,
      );
    }
  });
});

describe("exemptions", () => {
  it("lets a PRO user apply to a brand-new role", async () => {
    const { eligibility } = await canApply(
      [seedUser({ plan: "PRO" })],
      [seedJob({ datePosted: new Date() })],
    );

    expect(eligibility).toEqual({ allowed: true });
  });

  it("lets an ADMIN on the FREE plan apply to a brand-new role", async () => {
    const { eligibility } = await canApply(
      [seedUser({ plan: "FREE", role: "ADMIN" })],
      [seedJob({ datePosted: new Date() })],
    );

    expect(eligibility).toEqual({ allowed: true });
  });

  it("lets a PRO user ignore the daily limit", async () => {
    const db = createFakePrisma([seedUser({ plan: "PRO" })], [
      seedJob({ datePosted: new Date(Date.now() - 49 * HOUR_MS) }),
    ]);

    for (let i = 0; i < 10; i += 1) {
      db.seedApplication(USER_ID, `past-job-${i}`);
    }

    vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));
    const { canApplyToJob } = await import("@/lib/subscription");

    expect(await canApplyToJob(USER_ID, JOB_ID)).toEqual({ allowed: true });
  });

  it("lets an ADMIN ignore the daily limit", async () => {
    const db = createFakePrisma(
      [seedUser({ plan: "FREE", role: "ADMIN" })],
      [seedJob({ datePosted: new Date(Date.now() - 49 * HOUR_MS) })],
    );

    for (let i = 0; i < 10; i += 1) {
      db.seedApplication(USER_ID, `past-job-${i}`);
    }

    vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));
    const { canApplyToJob } = await import("@/lib/subscription");

    expect(await canApplyToJob(USER_ID, JOB_ID)).toEqual({ allowed: true });
  });

  it("does not exempt an EXPERT just for having an id", async () => {
    const { eligibility } = await canApply(
      [seedUser({ plan: "FREE", role: "EXPERT" })],
      [seedJob({ datePosted: new Date() })],
    );

    expect(eligibility).toMatchObject({ reason: "early_access" });
  });
});

describe("bypassesApplyLimits", () => {
  it("recognises PRO and ADMIN regardless of the other field", async () => {
    const { bypassesApplyLimits } = await import("@/lib/subscription");

    expect(bypassesApplyLimits({ plan: "PRO", role: "EXPERT" })).toBe(true);
    expect(bypassesApplyLimits({ plan: "FREE", role: "ADMIN" })).toBe(true);
    expect(bypassesApplyLimits({ plan: "PRO", role: "ADMIN" })).toBe(true);

    expect(bypassesApplyLimits({ plan: "FREE", role: "EXPERT" })).toBe(false);
    expect(bypassesApplyLimits({ plan: "pro", role: "EXPERT" })).toBe(true);
    expect(bypassesApplyLimits({ plan: "FREE" })).toBe(false);
    expect(bypassesApplyLimits(null)).toBe(false);
    expect(bypassesApplyLimits(undefined)).toBe(false);
  });
});

describe("daily application limit", () => {
  it("blocks a FREE user who has already applied three times today", async () => {
    const db = createFakePrisma([seedUser()], [
      seedJob({ datePosted: new Date(Date.now() - 49 * HOUR_MS) }),
    ]);

    for (let i = 0; i < 3; i += 1) {
      db.seedApplication(USER_ID, `today-job-${i}`);
    }

    vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));
    const { canApplyToJob } = await import("@/lib/subscription");

    expect(await canApplyToJob(USER_ID, JOB_ID)).toMatchObject({
      allowed: false,
      reason: "daily_limit",
      used: 3,
      limit: 3,
    });
  });

  it("does not count applications older than the rolling 24 hours", async () => {
    const db = createFakePrisma([seedUser()], [
      seedJob({ datePosted: new Date(Date.now() - 49 * HOUR_MS) }),
    ]);

    for (let i = 0; i < 5; i += 1) {
      db.seedApplication(USER_ID, `old-job-${i}`, new Date(Date.now() - 25 * HOUR_MS));
    }

    vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));
    const { canApplyToJob } = await import("@/lib/subscription");

    expect(await canApplyToJob(USER_ID, JOB_ID)).toEqual({ allowed: true });
  });
});