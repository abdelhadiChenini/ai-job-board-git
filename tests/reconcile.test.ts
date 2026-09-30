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
  vi.doMock("@/lib/admin", () => ({
    getAdminSession: async () => ({ user: { id: ADMIN_ID, role: "ADMIN" } }),
  }));
});

afterEach(() => {
  paypal.restore();
  vi.resetModules();
  vi.doUnmock("@/lib/admin");
});

async function reconcile(batch?: string) {
  const db = createFakePrisma(users);
  vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));
  const { POST } = await import("@/app/api/admin/reconcile-billing/route");
  const url = batch
    ? `https://example.com/api/admin/reconcile-billing?batch=${batch}`
    : "https://example.com/api/admin/reconcile-billing";
  const response = await POST(new Request(url, { method: "POST" }));
  return { db, response, body: await response.json() };
}

let users: FakeUser[] = [];

describe("reconcile-billing", () => {
  it("refuses non-admins", async () => {
    vi.doMock("@/lib/admin", () => ({ getAdminSession: async () => null }));
    const db = createFakePrisma([]);
    vi.doMock("@/lib/prisma", () => ({ prisma: db.prisma }));
    const { POST } = await import("@/app/api/admin/reconcile-billing/route");

    const response = await POST(
      new Request("https://example.com/api/admin/reconcile-billing", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(db.logs).toHaveLength(0);
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

    const { body } = await reconcile("2");

    expect(body.checked).toBe(2);
    expect(body.complete).toBe(false);
  });

  it("reports a full sweep when the batch is not filled", async () => {
    users = [proUser("u1", "S-1")];
    paypal.setSubscription("S-1", "ACTIVE");

    const { body } = await reconcile("25");

    expect(body.complete).toBe(true);
  });
});
