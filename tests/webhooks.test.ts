import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockPayPal, signatureHeaders, type PayPalMock } from "./helpers/mockPayPal";
import { createFakePrisma, type FakeUser } from "./helpers/fakePrisma";

const ADMIN_ID = "admin-1";
const USER_ID = "user-1";
const NEW_SUB = "I-NEWSUB";
const OLD_SUB = "I-OLDSUB";

function seedUser(overrides: Partial<FakeUser> = {}): FakeUser {
  return {
    id: USER_ID,
    email: "customer@example.com",
    plan: "FREE",
    paypalSubscriptionId: null,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

let paypal: PayPalMock;
let db: ReturnType<typeof createFakePrisma>;

beforeEach(() => {
  paypal = mockPayPal();
});

afterEach(() => {
  paypal.restore();
  vi.resetModules();
});

/** Install the in-memory database double for the module under test. */
async function withDb(users: FakeUser[]) {
  db = createFakePrisma(users);
  vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));
  return db;
}

async function send(body: unknown, headers: Record<string, string> = signatureHeaders()) {
  const { POST } = await import("@/app/api/webhooks/paypal/route");
  return POST(
    new Request("https://example.com/api/webhooks/paypal", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const activated = (id: string, customId = USER_ID) => ({
  event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
  resource: { id, custom_id: customId },
});

const expired = (id: string, customId = USER_ID) => ({
  event_type: "BILLING.SUBSCRIPTION.EXPIRED",
  resource: { id, custom_id: customId },
});

describe("webhook signature verification", () => {
  it("rejects a body PayPal did not sign", async () => {
    await withDb([seedUser()]);
    paypal.setVerification("FAILURE");

    const response = await send(activated(NEW_SUB));

    expect(response.status).toBe(401);
    expect(db.planOf(USER_ID)).toBe("FREE");
    expect(db.subscriptionOf(USER_ID)).toBeNull();
    expect(db.logs).toHaveLength(0);
  });

  it("rejects a request with no signature headers at all", async () => {
    await withDb([seedUser()]);

    const response = await send(activated(NEW_SUB), {
      "content-type": "application/json",
    });

    expect(response.status).toBe(401);
    expect(db.planOf(USER_ID)).toBe("FREE");
    expect(db.logs).toHaveLength(0);
  });

  it("rejects malformed JSON before spending a verification call", async () => {
    await withDb([seedUser()]);

    const response = await send("{not json");

    expect(response.status).toBe(400);
    expect(paypal.calls.verify).toBe(0);
  });
});

describe("activation", () => {
  it("grants PRO and records the subscription id", async () => {
    await withDb([seedUser()]);

    const response = await send(activated(NEW_SUB));

    expect(response.status).toBe(200);
    expect(db.planOf(USER_ID)).toBe("PRO");
    expect(db.subscriptionOf(USER_ID)).toBe(NEW_SUB);
    expect(db.logs).toEqual([
      expect.objectContaining({
        userId: USER_ID,
        oldPlan: "FREE",
        newPlan: "PRO",
        changedBy: "webhook",
      }),
    ]);
  });

  it("is idempotent across PayPal redeliveries", async () => {
    await withDb([seedUser()]);

    await send(activated(NEW_SUB));
    const second = await send(activated(NEW_SUB));

    expect(second.status).toBe(200);
    expect(db.planOf(USER_ID)).toBe("PRO");
    expect(db.logs).toHaveLength(1);
  });

  it("supersedes a previous subscription id when a user re-subscribes", async () => {
    await withDb([
      seedUser({ plan: "PRO", paypalSubscriptionId: OLD_SUB }),
    ]);

    await send(activated(NEW_SUB));

    expect(db.subscriptionOf(USER_ID)).toBe(NEW_SUB);
  });

  it("rejects an unknown custom_id", async () => {
    await withDb([seedUser()]);

    const response = await send(activated(NEW_SUB, "ghost-user"));

    expect(response.status).toBe(404);
    expect(db.logs).toHaveLength(0);
  });

  it("requires custom_id", async () => {
    await withDb([seedUser()]);

    const response = await send({
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: { id: NEW_SUB },
    });

    expect(response.status).toBe(422);
  });
});

describe("cancellation", () => {
  it("keeps paid access on CANCELLED", async () => {
    await withDb([
      seedUser({ plan: "PRO", paypalSubscriptionId: NEW_SUB }),
    ]);

    const response = await send({
      event_type: "BILLING.SUBSCRIPTION.CANCELLED",
      resource: { id: NEW_SUB, custom_id: USER_ID },
    });

    expect(response.status).toBe(200);
    expect(db.planOf(USER_ID)).toBe("PRO");
    expect(db.subscriptionOf(USER_ID)).toBe(NEW_SUB);
    expect(db.logs).toHaveLength(0);
  });
});

describe("expiration", () => {
  it("downgrades and clears the id when it matches the current subscription", async () => {
    await withDb([
      seedUser({ plan: "PRO", paypalSubscriptionId: NEW_SUB }),
    ]);

    const response = await send(expired(NEW_SUB));

    expect(response.status).toBe(200);
    expect(db.planOf(USER_ID)).toBe("FREE");
    expect(db.subscriptionOf(USER_ID)).toBeNull();
    expect(db.logs).toEqual([
      expect.objectContaining({
        userId: USER_ID,
        oldPlan: "PRO",
        newPlan: "FREE",
        changedBy: "webhook",
      }),
    ]);
  });

  it("ignores expiration of a subscription the user already replaced", async () => {
    // The regression this guards: a customer cancels, re-subscribes, then the
    // old subscription's EXPIRED arrives late. Acting on it would revoke the
    // access they just paid for.
    await withDb([
      seedUser({ plan: "PRO", paypalSubscriptionId: NEW_SUB }),
    ]);

    const response = await send(expired(OLD_SUB));

    expect(response.status).toBe(200);
    expect(db.planOf(USER_ID)).toBe("PRO");
    expect(db.subscriptionOf(USER_ID)).toBe(NEW_SUB);
    expect(db.logs).toHaveLength(0);
  });

  it("acknowledges the stale event so PayPal stops retrying it", async () => {
    await withDb([
      seedUser({ plan: "PRO", paypalSubscriptionId: NEW_SUB }),
    ]);

    const body = await (await send(expired(OLD_SUB))).json();

    expect(body.received).toBe(true);
    expect(body.changed).toBe(false);
    expect(body.reason).toBe("subscription_mismatch");
  });

  it("clears a stale id without logging a plan change when already FREE", async () => {
    await withDb([
      seedUser({ plan: "FREE", paypalSubscriptionId: NEW_SUB }),
    ]);

    await send(expired(NEW_SUB));

    expect(db.planOf(USER_ID)).toBe("FREE");
    expect(db.subscriptionOf(USER_ID)).toBeNull();
    expect(db.logs).toHaveLength(0);
  });
});

describe("unrelated events", () => {
  it("acknowledges event types it does not act on", async () => {
    await withDb([seedUser({ plan: "PRO", paypalSubscriptionId: NEW_SUB })]);

    const response = await send({
      event_type: "PAYMENT.SALE.COMPLETED",
      resource: { custom_id: USER_ID },
    });

    expect(response.status).toBe(200);
    expect(db.planOf(USER_ID)).toBe("PRO");
  });
});

describe("audit trail", () => {
  it("survives account deletion", async () => {
    await withDb([seedUser()]);
    const { applyPlanChange } = await import("@/lib/subscription");

    await applyPlanChange({
      userId: USER_ID,
      plan: "PRO",
      changedBy: "admin",
      changedById: ADMIN_ID,
    });

    // Mirrors the production FK: ON DELETE SET NULL on the subject relation.
    const log = db.logs[0];
    db.users.delete(USER_ID);

    expect(db.users.size).toBe(0);
    expect(db.logs).toHaveLength(1);
    expect(log.userId).toBe(USER_ID);
    expect(log.changedById).toBe(ADMIN_ID);
  });

  it("records no row for a no-op admin override", async () => {
    await withDb([seedUser({ plan: "PRO" })]);
    const { applyPlanChange } = await import("@/lib/subscription");

    const result = await applyPlanChange({
      userId: USER_ID,
      plan: "PRO",
      changedBy: "admin",
      changedById: ADMIN_ID,
    });

    expect(result).toEqual({ ok: true, changed: false });
    expect(db.logs).toHaveLength(0);
  });

  it("returns a not-found error instead of throwing", async () => {
    await withDb([seedUser()]);
    const { applyPlanChange } = await import("@/lib/subscription");

    const result = await applyPlanChange({
      userId: "ghost-user",
      plan: "PRO",
      changedBy: "admin",
    });

    expect(result).toEqual({ ok: false, error: "User not found." });
  });
});
