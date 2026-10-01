import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockPayPal, type PayPalMock } from "./helpers/mockPayPal";
import { createFakePrisma, type FakeUser } from "./helpers/fakePrisma";

const USER_ID = "user-1";
const SUB = "I-SUBSCRIPTION";

function seedUser(overrides: Partial<FakeUser> = {}): FakeUser {
  return {
    id: USER_ID,
    email: "customer@example.com",
    plan: "PRO",
    paypalSubscriptionId: SUB,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

let paypal: PayPalMock;

beforeEach(() => {
  paypal = mockPayPal();
});

afterEach(() => {
  paypal.restore();
  vi.resetModules();
  vi.doUnmock("@/lib/prisma");
});

async function cancel(users: FakeUser[], signedInAs: string | null = USER_ID) {
  const db = createFakePrisma(users);
  vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));
  vi.doMock("next-auth", () => ({
    getServerSession: async () =>
      signedInAs ? { user: { id: signedInAs, role: "EXPERT" } } : null,
  }));

  // The handler reads no request, but it is dispatched through a real Request
  // so the call site matches how Next invokes it.
  const { POST } = await import("@/app/api/paypal/cancel/route");
  const response = await (POST as unknown as (req: Request) => Promise<Response>)(
    new Request("https://example.com/api/paypal/cancel", { method: "POST" }),
  );

  return { db, response, body: await response.json() };
}

describe("authentication", () => {
  it("refuses an anonymous caller", async () => {
    paypal.setSubscription(SUB, "ACTIVE");

    const { response, body } = await cancel([seedUser()], null);

    expect(response.status).toBe(401);
    expect(paypal.calls.cancels).toHaveLength(0);
    expect(body.error).toBeTruthy();
  });

  it("returns 404 for an account that no longer exists", async () => {
    const { response } = await cancel([], USER_ID);

    expect(response.status).toBe(404);
  });
});

describe("successful cancellation", () => {
  it("cancels the subscription at PayPal", async () => {
    paypal.setSubscription(SUB, "ACTIVE");
    paypal.setCancelResult(SUB, true);

    const { response, body } = await cancel([seedUser()]);

    expect(response.status).toBe(200);
    expect(body.cancelled).toBe(true);
    expect(paypal.calls.cancels).toEqual([SUB]);
  });

  it("keeps the plan and subscription id on file", async () => {
    // The regression this guards: downgrading on cancel revokes access the
    // customer already paid for, and clearing the id makes the real EXPIRED
    // event look stale, so the account would never be downgraded at all.
    paypal.setSubscription(SUB, "ACTIVE");
    paypal.setCancelResult(SUB, true);

    const { db } = await cancel([seedUser()]);

    expect(db.planOf(USER_ID)).toBe("PRO");
    expect(db.subscriptionOf(USER_ID)).toBe(SUB);
    expect(db.logs).toHaveLength(0);
  });

  it("survives the 204 empty body", async () => {
    // A cancel answers 204 No Content; a route that called .json() on it would
    // throw and report failure for a cancellation PayPal had processed.
    paypal.setSubscription(SUB, "ACTIVE");
    paypal.setCancelResult(SUB, true);

    const { response, body } = await cancel([seedUser()]);

    expect(response.status).toBe(200);
    expect(body.accessRetained).toBe(true);
  });
});

describe("already cancelled or expired", () => {
  it("reports an already-cancelled subscription without calling PayPal", async () => {
    paypal.setSubscription(SUB, "CANCELLED");

    const { response, body } = await cancel([seedUser()]);

    expect(response.status).toBe(200);
    expect(body.alreadyCancelled).toBe(true);
    expect(paypal.calls.cancels).toHaveLength(0);
  });

  it("reports an expired subscription without calling PayPal", async () => {
    paypal.setSubscription(SUB, "EXPIRED");

    const { response, body } = await cancel([seedUser()]);

    expect(response.status).toBe(200);
    expect(body.alreadyExpired).toBe(true);
    expect(paypal.calls.cancels).toHaveLength(0);
  });
});

describe("refusals", () => {
  it("rejects a FREE account", async () => {
    paypal.setSubscription(SUB, "ACTIVE");

    const { response } = await cancel([
      seedUser({ plan: "FREE", paypalSubscriptionId: null }),
    ]);

    expect(response.status).toBe(409);
    expect(paypal.calls.cancels).toHaveLength(0);
  });

  it("rejects a PRO account with no subscription on file", async () => {
    const { response, body } = await cancel([
      seedUser({ paypalSubscriptionId: null }),
    ]);

    expect(response.status).toBe(409);
    expect(paypal.calls.cancels).toHaveLength(0);
    expect(body.error).toMatch(/support/i);
  });

  it("changes nothing when PayPal rejects the cancellation", async () => {
    paypal.setSubscription(SUB, "ACTIVE");
    paypal.setCancelResult(SUB, 422);

    const { db, response, body } = await cancel([seedUser()]);

    expect(response.status).toBe(502);
    expect(db.planOf(USER_ID)).toBe("PRO");
    expect(db.subscriptionOf(USER_ID)).toBe(SUB);
    expect(body.error).toBeTruthy();
  });

  it("changes nothing when PayPal is unreachable", async () => {
    // A network fault is not a cancellation. Guessing at a plan change we
    // could not confirm would be the worst possible outcome here.
    paypal.setSubscription(SUB, new Error("500"));

    const { db, response } = await cancel([seedUser()]);

    expect(response.status).toBe(502);
    expect(db.planOf(USER_ID)).toBe("PRO");
    expect(db.subscriptionOf(USER_ID)).toBe(SUB);
    expect(paypal.calls.cancels).toHaveLength(0);
  });
});