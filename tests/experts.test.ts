import { describe, expect, it } from "vitest";
import {
  compareExperts,
  getExpertTier,
  hasActiveSubscription,
  hasCompletedProfile,
  type ExpertOrderingProfile,
} from "@/lib/experts";

const COMPLETE = {
  bio: "Independent AI researcher focused on model evaluation.",
  skills: ["Python for Data Science", "LLM Evaluation"],
  linkedin: "https://linkedin.com/in/expert",
};

function makeExpert(
  overrides: Partial<Omit<ExpertOrderingProfile, "user">> & {
    user?: Partial<ExpertOrderingProfile["user"]>;
  } = {},
): ExpertOrderingProfile {
  const { user, ...rest } = overrides;
  return {
    bio: null,
    skills: [],
    linkedin: null,
    linkedInUrl: null,
    github: null,
    githubUrl: null,
    website: null,
    websiteUrl: null,
    xUrl: null,
    twitterUrl: null,
    youtube: null,
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    createdAt: new Date("2023-01-01T00:00:00.000Z"),
    ...rest,
    user: {
      isFeatured: false,
      plan: "FREE",
      paypalSubscriptionId: null,
      ...user,
    },
  };
}

describe("hasActiveSubscription", () => {
  it("treats a paid plan as active", () => {
    expect(hasActiveSubscription(makeExpert({ user: { plan: "PRO" } }).user)).toBe(true);
  });

  it("treats a live subscription id as active even on a stale plan", () => {
    expect(
      hasActiveSubscription(
        makeExpert({ user: { plan: "FREE", paypalSubscriptionId: "I-123" } }).user,
      ),
    ).toBe(true);
  });

  it("is case-insensitive about the plan column", () => {
    expect(hasActiveSubscription(makeExpert({ user: { plan: "pro" } }).user)).toBe(true);
  });

  it("is false for a free account with no subscription", () => {
    expect(hasActiveSubscription(makeExpert().user)).toBe(false);
  });
});

describe("hasCompletedProfile", () => {
  it("requires a bio, at least one skill and at least one link", () => {
    expect(hasCompletedProfile(makeExpert(COMPLETE))).toBe(true);
  });

  it("fails without a bio", () => {
    expect(hasCompletedProfile(makeExpert({ ...COMPLETE, bio: null }))).toBe(false);
    expect(hasCompletedProfile(makeExpert({ ...COMPLETE, bio: "   " }))).toBe(false);
  });

  it("fails without skills", () => {
    expect(hasCompletedProfile(makeExpert({ ...COMPLETE, skills: [] }))).toBe(false);
    expect(hasCompletedProfile(makeExpert({ ...COMPLETE, skills: "not-an-array" }))).toBe(false);
  });

  it("fails without any link", () => {
    expect(hasCompletedProfile(makeExpert({ ...COMPLETE, linkedin: null }))).toBe(false);
  });

  it("accepts any one of the portfolio link fields", () => {
    expect(
      hasCompletedProfile(makeExpert({ ...COMPLETE, linkedin: null, githubUrl: "https://github.com/x" })),
    ).toBe(true);
  });
});

describe("getExpertTier", () => {
  it("ranks paying experts first, complete profiles next, the rest last", () => {
    expect(getExpertTier(makeExpert({ user: { plan: "PRO" } }))).toBe(1);
    expect(getExpertTier(makeExpert(COMPLETE))).toBe(2);
    expect(getExpertTier(makeExpert())).toBe(3);
  });

  it("puts an incomplete paying expert above a complete free one", () => {
    expect(getExpertTier(makeExpert({ user: { plan: "PRO" } }))).toBe(1);
  });
});

describe("compareExperts", () => {
  it("orders by tier before recency", () => {
    const payingOld = makeExpert({
      bio: null,
      user: { plan: "PRO" },
      updatedAt: new Date("2020-01-01T00:00:00.000Z"),
    });
    const completeNew = makeExpert({
      ...COMPLETE,
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    });
    const incompleteNew = makeExpert({
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const sorted = [incompleteNew, completeNew, payingOld].sort(compareExperts);
    expect(sorted).toEqual([payingOld, completeNew, incompleteNew]);
  });

  it("orders most recently updated first within a tier", () => {
    const older = makeExpert({
      ...COMPLETE,
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    });
    const newer = makeExpert({
      ...COMPLETE,
      updatedAt: new Date("2024-06-01T00:00:00.000Z"),
    });

    expect([older, newer].sort(compareExperts)).toEqual([newer, older]);
  });

  it("falls back to createdAt when updatedAt ties", () => {
    const first = makeExpert({
      ...COMPLETE,
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      createdAt: new Date("2023-01-01T00:00:00.000Z"),
    });
    const second = makeExpert({
      ...COMPLETE,
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      createdAt: new Date("2023-06-01T00:00:00.000Z"),
    });

    expect([first, second].sort(compareExperts)).toEqual([second, first]);
  });

  it("uses the featured flag as the final tie-break", () => {
    const featured = makeExpert({ ...COMPLETE, user: { isFeatured: true } });
    const plain = makeExpert(COMPLETE);

    expect([plain, featured].sort(compareExperts)).toEqual([featured, plain]);
  });

  it("produces a stable, page-boundary-independent order", () => {
    const experts = Array.from({ length: 30 }, (_, index) =>
      makeExpert({
        ...(index % 3 === 0 ? COMPLETE : {}),
        user: index % 5 === 0 ? { plan: "PRO" } : {},
        updatedAt: new Date(2024, 0, index + 1),
      }),
    );

    const full = [...experts].sort(compareExperts).map((e) => e.updatedAt.getTime());
    const reshuffled = [...experts].reverse().sort(compareExperts).map((e) => e.updatedAt.getTime());

    expect(reshuffled).toEqual(full);
  });
});
