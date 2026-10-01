/**
 * Audience segments for the admin bulk-email tool.
 *
 * Kept free of any Prisma import so client components can share the same
 * constants and labels as the server-side queries without pulling the database
 * client into the browser bundle.
 */

export const AUDIENCES = ["incomplete", "completed", "all"] as const;

export type Audience = (typeof AUDIENCES)[number];

export const DEFAULT_AUDIENCE: Audience = "incomplete";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  incomplete: "Incomplete Profiles",
  completed: "Completed Profiles",
  all: "All Experts",
};

/** Narrows an untrusted request value to a known segment. */
export function parseAudience(value: unknown): Audience | null {
  return typeof value === "string" &&
    (AUDIENCES as readonly string[]).includes(value)
    ? (value as Audience)
    : null;
}