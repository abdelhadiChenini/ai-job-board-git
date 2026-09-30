import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockPayPal, type PayPalMock } from "./helpers/mockPayPal";
import { createFakePrisma, type FakeUser } from "./helpers/fakePrisma";

const ADMIN_ID = "admin-1";

function proUser(id: string, subscriptionId: string | null): FakeUser {
  return {
    id,
    email: `${id}@example.com`,
    plan: "PRO",
    paypalSubscriptionId: subscriptionId,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

let paypal: PayPalMock;

beforeEach(() => {
  paypal = mockPayPal();
});

afterEach(() => {
  paypal.restore();
  vi.resetModules();
  vi.doUnmock("@/lib/admin");
});

async function reconcile(
  options: {
    batch?: string;
    headers?: Record<string, string>;
    admin?: boolean;
  } = {},
) {
  const { batch, headers = {}, admin = true } = options;

  vi.doMock("@/lib/admin", () => ({
    getAdminSession: async () =>
      admin ? { user: { id: ADMIN_ID, role: "ADMIN" } } : null,
  }));

  const db = createFakePrisma(users);
  vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));
  const { POST } = await import("@/app/api/admin/reconcile-billing/route");
  const url = batch
    ? `https://example.com/api/admin/reconcile-billing?batch=${batch}`
    : "https://example.com/api/admin/reconcile-billing";
  const response = await POST(new Request(url, { method: "POST", headers }));
  return { db, response, body: await response.json() };
}

let users: FakeUser[] = [];

describe("reconcile-billing", () => {
  it("refuses non-admins", async () => {
    const { response, body } = await reconcile({ admin: false });

    expect(response.status).toBe(401);
    expect(body.downgraded).toBeUndefined();
  });

  it("downgrades a PRO user whose subscription expired", async () => {
    users = [proUser("u1", "S-EXPIRED")];
    paypal.setSubscription("S-EXPIRED", "EXPIRED");

    const { db, body } = await reconcile();

    expect(body.downgraded).toBe(1);
    expect(db.planOf("u1")).toBe("FREE");
    expect(db.subscriptionOf("u1")).toBeNull();
    expect(db.logs).toEqual([
      expect.objectContaining({
        oldPlan: "PRO",
        newPlan: "FREE",
        // Distinct from "webhook": no PayPal event caused this.
        changedBy: "reconcile",
      }),
    ]);
  });

  it("keeps a user whose subscription is still active", async () => {
    users = [proUser("u1", "S-ACTIVE")];
    paypal.setSubscription("S-ACTIVE", "ACTIVE");

    const { db, body } = await reconcile();

    expect(body.downgraded).toBe(0);
    expect(body.kept).toBe(1);
    expect(db.planOf("u1")).toBe("PRO");
    expect(db.logs).toHaveLength(0);
  });

  it("keeps a cancelled user, who retains access until the period ends", async () => {
    users = [proUser("u1", "S-CANCELLED")];
    paypal.setSubscription("S-CANCELLED", "CANCELLED");

    const { db, body } = await reconcile();

    expect(body.downgraded).toBe(0);
    expect(db.planOf("u1")).toBe("PRO");
  });

  it("downgrades a suspended subscription from failed payment recovery", async () => {
    users = [proUser("u1", "S-SUSPENDED")];
    paypal.setSubscription("S-SUSPENDED", "SUSPENDED");

    const { db, body } = await reconcile();

    expect(body.downgraded).toBe(1);
    expect(db.planOf("u1")).toBe("FREE");
  });

  it("reports a PRO user with no subscription instead of downgrading them", async () => {
    // Could be granted by hand, or an activation webhook was lost. PayPal
    // cannot confirm it, so revoking would be the dangerous guess.
    users = [proUser("u1", null)];

    const { db, body } = await reconcile();

    expect(body.downgraded).toBe(0);
    expect(body.skipped).toBe(1);
    expect(body.skippedDetails[0].reason).toMatch(/No subscription id/);
    expect(db.planOf("u1")).toBe("PRO");
  });

  it("continues past one failing lookup", async () => {
    users = [proUser("u1", "S-EXPIRED"), proUser("u2", "S-BROKEN")];
    paypal.setSubscription("S-EXPIRED", "EXPIRED");
    paypal.setSubscription("S-BROKEN", new Error("500"));

    const { db, body } = await reconcile();

    expect(body.checked).toBe(2);
    expect(body.downgraded).toBe(1);
    expect(body.skipped).toBe(1);
    expect(db.planOf("u1")).toBe("FREE");
    expect(db.planOf("u2")).toBe("PRO");
  });

  it("does not touch FREE users", async () => {
    users = [
      {
        ...proUser("u1", null),
        plan: "FREE",
      },
    ];

    const { body } = await reconcile();

    expect(body.checked).toBe(0);
  });

  it("caps the batch and reports that more remain", async () => {
    users = [
      proUser("u1", "S-1"),
      proUser("u2", "S-2"),
      proUser("u3", "S-3"),
    ];
    for (const id of ["S-1", "S-2", "S-3"]) paypal.setSubscription(id, "ACTIVE");

    const { body } = await reconcile({ batch: "2" });

    expect(body.checked).toBe(2);
    expect(body.complete).toBe(false);
  });

  it("reports a full sweep when the batch is not filled", async () => {
    users = [proUser("u1", "S-1")];
    paypal.setSubscription("S-1", "ACTIVE");

    const { body } = await reconcile({ batch: "25" });

    expect(body.complete).toBe(true);
  });
});

describe("scheduled-job authorization", () => {
  const SECRET = "reconcile-secret-value";

  beforeEach(() => {
    process.env.RECONCILIATION_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.RECONCILIATION_SECRET;
  });

  it("accepts the secret as a bearer token, with no session", async () => {
    users = [proUser("u1", "S-EXPIRED")];
    paypal.setSubscription("S-EXPIRED", "EXPIRED");

    const { response, body } = await reconcile({
      admin: false,
      headers: { Authorization: `Bearer ${SECRET}` },
    });

    expect(response.status).toBe(200);
    expect(body.downgraded).toBe(1);
  });

  it("accepts the dedicated header too", async () => {
    users = [proUser("u1", "S-EXPIRED")];
    paypal.setSubscription("S-EXPIRED", "EXPIRED");

    const { response } = await reconcile({
      admin: false,
      headers: { "x-reconciliation-secret": SECRET },
    });

    expect(response.status).toBe(200);
  });

  it("rejects a wrong secret", async () => {
    users = [proUser("u1", "S-EXPIRED")];
    paypal.setSubscription("S-EXPIRED", "EXPIRED");

    const { response, db } = await reconcile({
      admin: false,
      headers: { Authorization: "Bearer not-the-secret" },
    });

    expect(response.status).toBe(401);
    expect(db.planOf("u1")).toBe("PRO");
  });

  it("rejects a secret that is only a prefix of the real one", async () => {
    const { response } = await reconcile({
      admin: false,
      headers: { Authorization: `Bearer ${SECRET.slice(0, 8)}` },
    });

    expect(response.status).toBe(401);
  });

  it("rejects an unauthenticated caller when no secret is configured", async () => {
    // The cron must not become reachable just because the deploy forgot the env
    // var: an unset secret denies everyone rather than allowing everyone.
    delete process.env.RECONCILIATION_SECRET;

    const { response } = await reconcile({ admin: false });

    expect(response.status).toBe(401);
  });

  it("warns when a session-authorised run has no secret configured", async () => {
    delete process.env.RECONCILIATION_SECRET;
    users = [proUser("u1", "S-1")];
    paypal.setSubscription("S-1", "ACTIVE");

    const { response, body } = await reconcile();

    expect(response.status).toBe(200);
    expect(body.warning).toMatch(/RECONCILIATION_SECRET/);
  });
});
