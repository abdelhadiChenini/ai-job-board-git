import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the browsing funnel: no card, carousel or list may link out to
 * `/api/redirect`.
 *
 * The suite has no jsdom, so components cannot be rendered here — this asserts
 * the invariant at the source level instead. That is the right level for it: the
 * failure mode being guarded against is someone re-adding an outbound link prop,
 * which is a code-shape regression rather than a behavioural one, and a render
 * test would not have caught it any earlier than grep would.
 *
 * `/api/redirect` remains a working, entitlement-checked endpoint. It is simply
 * no longer a navigation target for a card: browsing goes to the detail page,
 * and leaving for the employer's site happens only from the apply action, which
 * is the one place the paywall is actually in the reader's way.
 */

const ROOTS = ["app", "components"];
const ROUTE_TOKEN = "/api/redirect";
const SELF_REFERENCES = new Set(["app\\api\\redirect\\route.ts"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.tsx$/.test(full)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Blanks out comments so prose about the route does not read as a link to it.
 *
 * Without this, the one file that most needs to explain why the outbound link
 * was removed would be the file the guard fails on, and the obvious "fix" would
 * be to delete the explanation. `//` preceded by `:` is left alone so protocol
 * strings such as `https://` survive intact.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(?<![:"'`\\]):\/\/[^\n]*/g, "");
}

describe("card routing", () => {
  const files = ROOTS.flatMap((root) => walk(root));

  it("has components to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("no component links out to /api/redirect", () => {
    const offenders = files
      .filter((file) => !SELF_REFERENCES.has(file))
      .filter((file) =>
        stripComments(readFileSync(file, "utf8")).includes(ROUTE_TOKEN),
      );

    expect(offenders).toEqual([]);
  });

  it("JobCard takes no external url prop", () => {
    // The fallback that routed slugless cards outward was the actual leak, so
    // the prop itself is removed rather than merely unused.
    const source = stripComments(
      readFileSync(join("app", "components", "JobCard.tsx"), "utf8"),
    );

    expect(source).not.toMatch(/\burl\??:\s*string/);
    expect(source).not.toContain(ROUTE_TOKEN);
  });

  it("JobCard still links to the detail page when a slug exists", () => {
    const source = stripComments(
      readFileSync(join("app", "components", "JobCard.tsx"), "utf8"),
    );

    expect(source).toContain("/opportunities/${slug}");
  });
});