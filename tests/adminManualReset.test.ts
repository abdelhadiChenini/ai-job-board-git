import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Covers the admin-triggered password reset.
 *
 * The thing that must never go wrong here is a non-admin getting a reset link
 * for someone else's account, so the authorisation cases are tested first and
 * most explicitly.
 */

type StoredUser = { id: string; email: string };
type StoredToken = { email: string; token: string; expires: Date };

const store = vi.hoisted(() => ({
  users: [] as StoredUser[],
  tokens: [] as StoredToken[],
}));

const mailer = vi.hoisted(() => ({
  sent: [] as { to: string; resetUrl: string }[],
  failWith: null as Error | null,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: async ({
        where,
      }: {
        where: { id?: string; email?: string };
      }) => {
        if (where.id) {
          return store.users.find((user) => user.id === where.id) ?? null;
        }
        if (where.email) {
          return store.users.find((user) => user.email === where.email) ?? null;
        }
        return null;
      },
    },
    passwordResetToken: {
      create: async ({
        data,
      }: {
        data: { email: string; token: string; expires: Date };
      }) => {
        store.tokens.push({ ...data });
        return data;
      },
      deleteMany: async ({ where }: { where: { email: string } }) => {
        const before = store.tokens.length;
        store.tokens = store.tokens.filter((token) => token.email !== where.email);
        return { count: before - store.tokens.length };
      },
    },
  },
}));

vi.mock("@/lib/mailer", () => ({
  sendPasswordResetEmail: async ({
    to,
    resetUrl,
  }: {
    to: string;
    resetUrl: string;
  }) => {
    if (mailer.failWith) throw mailer.failWith;
    mailer.sent.push({ to, resetUrl });
  },
}));

const SITE = "https://ameelai.com";

const ADMIN_SESSION = { user: { id: "admin-1", role: "ADMIN" } };

/**
 * The session is mocked per call so a test can hand in a non-admin, or no
 * session at all, without reloading the module.
 */
async function sendReset(
  target: { userId?: string | null; email?: string | null },
  session: unknown = ADMIN_SESSION,
) {
  vi.doMock("@/lib/admin", () => ({
    getAdminSession: async () => session,
  }));

  const { sendManualPasswordReset } = await import(
    "@/app/admin/users/actions"
  );
  return sendManualPasswordReset(target);
}

beforeEach(() => {
  store.users = [];
  store.tokens = [];
  mailer.sent = [];
  mailer.failWith = null;

  process.env.NEXT_PUBLIC_SITE_URL = SITE;
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXTAUTH_URL;
});

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/admin");
});

describe("authorisation", () => {
  it("refuses a caller with no session", async () => {
    store.users.push({ id: "user-1", email: "expert@example.com" });

    const result = await sendReset({ userId: "user-1" }, null);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Unauthorized.");
    expect(result.resetUrl).toBeUndefined();
    expect(store.tokens).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it("refuses a signed-in user who is not an admin", async () => {
    store.users.push({ id: "user-1", email: "expert@example.com" });

    const result = await sendReset(
      { userId: "user-1" },
      { user: { id: "expert-1", role: "EXPERT" } },
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Unauthorized.");
    expect(result.resetUrl).toBeUndefined();
    expect(store.tokens).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it("refuses a request that names neither a user id nor an email", async () => {
    const result = await sendReset({});

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Missing user id or email.");
    expect(store.tokens).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });
});

describe("issuing a manual reset", () => {
  it("returns the absolute reset link and emails it to the user", async () => {
    store.users.push({ id: "user-1", email: "expert@example.com" });

    const result = await sendReset({ userId: "user-1" });

    expect(result.ok).toBe(true);
    expect(result.email).toBe("expert@example.com");

    const url = new URL(result.resetUrl ?? "");
    expect(url.origin).toBe(SITE);
    expect(url.pathname).toBe("/reset-password");
    expect(url.searchParams.get("token")).toBeTruthy();

    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0].to).toBe("expert@example.com");
    expect(mailer.sent[0].resetUrl).toBe(result.resetUrl);
  });

  it("accepts an email address as the target", async () => {
    store.users.push({ id: "user-1", email: "expert@example.com" });

    const result = await sendReset({ email: "expert@example.com" });

    expect(result.ok).toBe(true);
    expect(result.email).toBe("expert@example.com");
    expect(mailer.sent).toHaveLength(1);
  });

  it("stores only a hash of the token, never the token itself", async () => {
    store.users.push({ id: "user-1", email: "expert@example.com" });

    const result = await sendReset({ userId: "user-1" });

    const plain = new URL(result.resetUrl ?? "").searchParams.get("token");
    expect(store.tokens).toHaveLength(1);
    expect(store.tokens[0].token).not.toBe(plain);
    expect(store.tokens[0].token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gives the token an expiry an hour out", async () => {
    store.users.push({ id: "user-1", email: "expert@example.com" });

    const result = await sendReset({ userId: "user-1" });

    const minutes = (store.tokens[0].expires.getTime() - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(55);
    expect(minutes).toBeLessThanOrEqual(60);
    expect(result.expiresAt).toBe(store.tokens[0].expires.toISOString());
  });

  it("retires the previous link when a new one is issued", async () => {
    store.users.push({ id: "user-1", email: "expert@example.com" });

    await sendReset({ userId: "user-1" });
    await sendReset({ userId: "user-1" });

    expect(store.tokens).toHaveLength(1);
    expect(mailer.sent).toHaveLength(2);
  });

  it("reports a target that does not exist and sends nothing", async () => {
    const result = await sendReset({ email: "nobody@example.com" });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("User not found.");
    expect(result.resetUrl).toBeUndefined();
    expect(store.tokens).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it("issues a link for an admin account as well as an expert", async () => {
    store.users.push({ id: "admin-2", email: "boss@example.com" });

    const result = await sendReset({ userId: "admin-2" });

    expect(result.ok).toBe(true);
    expect(mailer.sent[0].to).toBe("boss@example.com");
  });
});

describe("when the email cannot be sent", () => {
  it("reports the failure and leaves no usable token behind", async () => {
    store.users.push({ id: "user-1", email: "expert@example.com" });
    mailer.failWith = new Error("smtp is down");

    const result = await sendReset({ userId: "user-1" });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("could not be sent");
    expect(result.resetUrl).toBeUndefined();
    expect(store.tokens).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });
});
