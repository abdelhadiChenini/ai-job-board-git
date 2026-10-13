import { prisma } from "@/lib/prisma";
import { calculateCompleteness } from "@/lib/completeness";
import type { Audience } from "@/lib/audiences";

/**
 * Shared segmentation + audience definition for the admin bulk-email campaigns.
 *
 * The admin stat card and the bulk-send route both build on the helpers here so
 * the advertised recipient count can never drift from who actually receives the
 * campaign.
 */

export type IncompleteProfile = {
  bio: string | null;
  skills: unknown;
  hourlyRate: string | null;
  country: string | null;
  stateRegion: string | null;
  languages: string | null;
  education: string | null;
};

export {
  AUDIENCES,
  AUDIENCE_LABELS,
  DEFAULT_AUDIENCE,
  parseAudience,
  type Audience,
} from "@/lib/audiences";

function isIncomplete(profile: IncompleteProfile | null): boolean {
  // A missing profile scores 0 inside `calculateCompleteness`, so this also
  // covers experts who never created one.
  return calculateCompleteness(profile) < 100;
}

/**
 * Experts who have not opted out of marketing email. Registration always creates
 * a profile with `emailUpdates` defaulting to true, so accounts without one are
 * treated as opted in.
 *
 * The opt-out filter applies to every segment, not just the incomplete one —
 * consent to hear from us does not disappear because a profile got finished.
 */
const recipientWhere = {
  role: "EXPERT" as const,
  OR: [
    { expertProfile: null },
    { expertProfile: { emailUpdates: true } },
  ],
};

type ExpertRow = {
  id: string;
  email: string;
  expertProfile: {
    bio: string | null;
    skills: unknown;
    hourlyRate: string | null;
    country: string | null;
    stateRegion: string | null;
    languages: string | null;
    education: string | null;
  } | null;
};

function matchesAudience(user: ExpertRow, audience: Audience): boolean {
  if (audience === "all") return true;

  const incomplete = isIncomplete({
    bio: user.expertProfile?.bio ?? null,
    skills: user.expertProfile?.skills ?? null,
    hourlyRate: user.expertProfile?.hourlyRate ?? null,
    country: user.expertProfile?.country ?? null,
    stateRegion: user.expertProfile?.stateRegion ?? null,
    languages: user.expertProfile?.languages ?? null,
    education: user.expertProfile?.education ?? null,
  });

  return audience === "incomplete" ? incomplete : !incomplete;
}

async function loadExperts(): Promise<ExpertRow[]> {
  return prisma.user.findMany({
    where: recipientWhere,
    select: {
      id: true,
      email: true,
      expertProfile: {
        select: {
          bio: true,
          skills: true,
          hourlyRate: true,
          country: true,
          stateRegion: true,
          languages: true,
          education: true,
        },
      },
    },
  });
}

export async function findAudienceRecipients(audience: Audience): Promise<ExpertRow[]> {
  const users = await loadExperts();
  return users.filter((user) => matchesAudience(user, audience));
}

/**
 * All segment sizes in one pass, so switching the dropdown in the admin UI does
 * not require a round trip and the three numbers stay consistent with each
 * other.
 */
export async function countAllAudiences(): Promise<Record<Audience, number>> {
  const users = await loadExperts();

  const counts: Record<Audience, number> = {
    incomplete: 0,
    completed: 0,
    all: users.length,
  };

  for (const user of users) {
    counts[matchesAudience(user, "incomplete") ? "incomplete" : "completed"] += 1;
  }

  return counts;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Admin-authored copy is escaped before it is interpolated into the HTML body. */
function toParagraphs(message: string): string {
  return message
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">${escapeHtml(
          block,
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("\n          ");
}

/**
 * Renders an admin-authored broadcast email.
 *
 * There is deliberately no campaign shell here: the subject and the message are
 * the only content the admin supplies, so the body is exactly that message with
 * blank lines turned into paragraphs. No per-segment headings, intros, CTAs or
 * links are injected, which is what makes this reusable for any announcement.
 */
export function buildBroadcastEmail({
  subject,
  message,
}: {
  subject: string;
  message: string;
}) {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:28px 32px;">
                ${toParagraphs(message)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = message.trim();

  return { html, text };
}