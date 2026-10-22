import crypto from "node:crypto";

/**
 * Helpers for the password reset flow.
 *
 * Two rules drive everything here:
 *
 * 1. The link in the email has to be absolute. A relative
 *    `/reset-password?token=...` is resolved by the mail client against
 *    whatever page it happens to be showing, so the link lands nowhere. The
 *    origin therefore always comes from the configured app URL.
 * 2. Only a hash of the token is stored. The plain token exists in the email
 *    and in the user's browser; the database only ever holds its SHA-256
 *    digest, so a leaked row cannot be replayed as a reset link.
 *
 * Kept free of Prisma and of any request context so both the server action
 * that issues tokens and the page that redeems them read the same rules.
 */

/** Reset links stop working one hour after they are issued. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Used only when no origin is configured at all, i.e. local development. */
const FALLBACK_BASE_URL = "http://localhost:3000";

/**
 * The public origin of the site, without a trailing slash.
 *
 * `NEXT_PUBLIC_SITE_URL` is the documented variable (see `.env.example`).
 * `NEXT_PUBLIC_APP_URL` is accepted as an alias because the sitemap already
 * reads that name, and `NEXTAUTH_URL` is the last resort because it always
 * points at the deployment the auth flow runs on.
 *
 * Anything that is not a valid http(s) URL is skipped rather than trusted, so a
 * typo in the environment cannot produce a link that points somewhere else.
 */
export function getAppBaseUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;

    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
    } catch {
      continue;
    }
  }

  return FALLBACK_BASE_URL;
}

/** The absolute URL the reset link points at. */
export function buildResetPasswordUrl(token: string): string {
  return `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

/** 256 bits of randomness, hex encoded so it survives a URL unchanged. */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * The digest that is written to (and looked up in) the database.
 *
 * SHA-256 over the plain token: the token is already high entropy random
 * data, so there is nothing to stretch and nothing to salt — a plain digest is
 * what makes the lookup deterministic.
 */
export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** The moment a token issued now stops being valid. */
export function getResetTokenExpiry(now: number = Date.now()): Date {
  return new Date(now + RESET_TOKEN_TTL_MS);
}

/** Whether a stored token is past its expiry. */
export function isResetTokenExpired(expires: Date, now: number = Date.now()): boolean {
  return expires.getTime() < now;
}
