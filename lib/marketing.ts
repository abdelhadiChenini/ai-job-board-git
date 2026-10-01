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
 * Per-segment shell copy. The intro paragraph is what most readers act on, so
 * telling a fully-complete expert to "finish" their profile would be both wrong
 * and a good reason to mark the mail as spam.
 */
const SEGMENT_COPY: Record<
  Audience,
  { eyebrow: string; heading: string; intro: string; cta: string }
> = {
  incomplete: {
    eyebrow: "Action needed",
    heading: "Finish your expert profile",
    intro:
      "Your profile is not quite finished yet. Companies can only shortlist and apply to experts whose profiles are complete, so the last few fields are what stand between you and those applications.",
    cta: "Complete my profile",
  },
  completed: {
    eyebrow: "Profile verified",
    heading: "Your profile is working for you",
    intro:
      "Your expert profile is fully complete, which means companies hiring in your area of expertise can find and shortlist you. Keep an eye on new opportunities as they are posted.",
    cta: "View my profile",
  },
  all: {
    eyebrow: "Your account",
    heading: "Make sure your profile is up to date",
    intro:
      "The more complete your expert profile is, the more likely companies are to find and reach out to you. It only takes a few minutes to review your details.",
    cta: "Review my profile",
  },
};

export function buildReengagementEmail({
  subject,
  message,
  siteUrl,
  audience,
}: {
  subject: string;
  message: string;
  siteUrl: string;
  audience: Audience;
}) {
  const profileUrl = `${siteUrl.replace(/\/+$/, "")}/dashboard/edit`;
  const copy = SEGMENT_COPY[audience];

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
              <td style="padding:28px 32px 8px;">
                <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;">
                  ${escapeHtml(copy.eyebrow)}
                </p>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;color:#0f172a;">
                  ${escapeHtml(copy.heading)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
                  ${escapeHtml(copy.intro)}
                </p>
                ${toParagraphs(message)}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:9999px;background-color:#2563eb;">
                      <a href="${escapeHtml(profileUrl)}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9999px;">
                        ${escapeHtml(copy.cta)}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#64748b;">
                  Button not working? Copy this link into your browser:<br />
                  <a href="${escapeHtml(profileUrl)}" style="color:#2563eb;word-break:break-all;">${escapeHtml(profileUrl)}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b;">
                  You are receiving this because you registered an expert account on our
                  platform. You can unsubscribe from these emails from your profile settings.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    copy.heading,
    "",
    copy.intro,
    "",
    message.trim(),
    "",
    `${copy.cta}: ${profileUrl}`,
  ].join("\n");

  return { html, text };
}