import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

/**
 * Covers the password reset flow end to end: the forgot-password request that
 * issues a token and emails a link, and the reset that redeems it.
 *
 * The two halves are the same feature, so they are tested together — a token
 * that the request side writes and the reset side cannot read is exactly the
 * bug this suite exists to catch.
 */

const store = vi.hoisted(() => ({
  users: [] as { id: string; email: string; hashedPassword: string }[],
  tokens: [] as { email: string; token: string; expires: Date }[],
}));

const sent = vi.hoisted(() => [] as { to: string; resetUrl: string }[]);

const redirects = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: async ({ where }: { where: { email: string } }) =>
        store.users.find((user) => user.email === where.email) ?? null,
      updateMany: async ({
        where,
        data,
      }: {
        where: { email: string };
        data: { hashedPassword: string };
      }) => {
        const user = store.users.find((row) => row.email === where.email);
        if (!user) return { count: 0 };
        user.hashedPassword = data.hashedPassword;
        return { count: 1 };
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
      findUnique: async ({ where }: { where: { token: string } }) =>
        store.tokens.find((token) => token.token === where.token) ?? null,
      delete: async ({ where }: { where: { token: string } }) => {
        const index = store.tokens.findIndex((token) => token.token === where.token);
        if (index === -1) {
          throw new Error("An operation failed because the record was not found.");
        }
        return store.tokens.splice(index, 1)[0];
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
    sent.push({ to, resetUrl });
  },
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirects.push(url);
    const error = new Error("NEXT_REDIRECT") as Error & { digest: string };
    error.digest = `NEXT_REDIRECT;replace;${url}`;
    throw error;
  },
}));

import { requestPasswordReset } from "@/app/forgot-password/actions";
import { resetPassword } from "@/app/reset-password/actions";
import { hashResetToken } from "@/lib/password-reset";

const EMAIL = "expert@example.com";
const SITE = "https://ameelai.com";

function seedUser(overrides: Partial<{ email: string; hashedPassword: string }> = {}) {
  const user = {
    id: "user-1",
    email: EMAIL,
    hashedPassword: "original-hash",
    ...overrides,
  };
  store.users.push(user);
  return user;
}

/** The plain token only ever exists in the emailed link. */
function tokenFrom(resetUrl: string): string {
  return new URL(resetUrl).searchParams.get("token") ?? "";
}

beforeEach(() => {
  store.users = [];
  store.tokens = [];
  sent.length = 0;
  redirects.length = 0;

  process.env.NEXT_PUBLIC_SITE_URL = SITE;
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXTAUTH_URL;
});

describe("requesting a reset link", () => {
  it("emails an absolute link built from the configured app url", async () => {
    seedUser();

    const result = await requestPasswordReset(EMAIL);

    expect(result.ok).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(EMAIL);

    const url = new URL(sent[0].resetUrl);
    expect(url.origin).toBe(SITE);
    expect(url.pathname).toBe("/reset-password");
    expect(url.searchParams.get("token")).toBeTruthy();
  });

  it("accepts NEXT_PUBLIC_APP_URL as an alias", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    seedUser();

    await requestPasswordReset(EMAIL);

    expect(new URL(sent[0].resetUrl).origin).toBe("https://app.example.com");
  });

  it("does not leave a trailing slash on the base url", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = `${SITE}/`;
    seedUser();

    await requestPasswordReset(EMAIL);

    expect(sent[0].resetUrl.startsWith(`${SITE}/reset-password?`)).toBe(true);
  });

  it("stores only a hash of the token, never the token itself", async () => {
    seedUser();

    await requestPasswordReset(EMAIL);

    const plain = tokenFrom(sent[0].resetUrl);
    expect(store.tokens).toHaveLength(1);
    expect(store.tokens[0].token).not.toBe(plain);
    expect(store.tokens[0].token).toBe(hashResetToken(plain));
  });

  it("gives the token an expiry an hour out", async () => {
    seedUser();

    await requestPasswordReset(EMAIL);

    const minutes = (store.tokens[0].expires.getTime() - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(55);
    expect(minutes).toBeLessThanOrEqual(60);
  });

  it("retires the previous link when a new one is issued", async () => {
    seedUser();

    await requestPasswordReset(EMAIL);
    await requestPasswordReset(EMAIL);

    expect(store.tokens).toHaveLength(1);
    expect(sent).toHaveLength(2);
  });

  it("says nothing about addresses without an account", async () => {
    const result = await requestPasswordReset("nobody@example.com");

    expect(result.ok).toBe(true);
    expect(result.message).toContain("If an account exists");
    expect(store.tokens).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("rejects an address that is not an email", async () => {
    const result = await requestPasswordReset("not-an-email");

    expect(result.ok).toBe(false);
    expect(store.tokens).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("normalises the address before storing the token", async () => {
    seedUser({ email: "expert@example.com" });

    await requestPasswordReset("  Expert@Example.COM  ");

    expect(store.tokens[0].email).toBe(EMAIL);
  });
});

describe("redeeming a reset link", () => {
  it("changes the password and consumes the token", async () => {
    const user = seedUser();

    await requestPasswordReset(EMAIL);
    const token = tokenFrom(sent[0].resetUrl);

    await expect(resetPassword(token, "brand-new-password")).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(redirects).toEqual(["/login?success=password-reset"]);
    expect(await bcrypt.compare("brand-new-password", user.hashedPassword)).toBe(
      true,
    );
    expect(store.tokens).toHaveLength(0);
  });

  it("refuses a link that was never issued", async () => {
    const user = seedUser();

    const result = await resetPassword("not-a-real-token", "brand-new-password");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("invalid or expired");
    expect(user.hashedPassword).toBe("original-hash");
  });

  it("refuses a link that has expired", async () => {
    const user = seedUser();

    await requestPasswordReset(EMAIL);
    const token = tokenFrom(sent[0].resetUrl);
    store.tokens[0].expires = new Date(Date.now() - 1000);

    const result = await resetPassword(token, "brand-new-password");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("expired");
    expect(user.hashedPassword).toBe("original-hash");
    expect(store.tokens).toHaveLength(0);
  });

  it("refuses to reuse a link that was already redeemed", async () => {
    seedUser();

    await requestPasswordReset(EMAIL);
    const token = tokenFrom(sent[0].resetUrl);

    await expect(resetPassword(token, "brand-new-password")).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    const second = await resetPassword(token, "another-password");
    expect(second.ok).toBe(false);
    expect(second.error).toContain("invalid or expired");
  });

  it("refuses a password that is too short", async () => {
    seedUser();

    await requestPasswordReset(EMAIL);
    const token = tokenFrom(sent[0].resetUrl);

    const result = await resetPassword(token, "short");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("8 characters");
    expect(store.tokens).toHaveLength(1);
  });

  it("refuses an empty token", async () => {
    const result = await resetPassword("", "brand-new-password");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("invalid or expired");
  });
});
