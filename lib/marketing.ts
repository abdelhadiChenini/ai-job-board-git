import { prisma } from "@/lib/prisma";
import { calculateCompleteness } from "@/lib/completeness";

/**
 * Shared audience definition for the "complete your expert profile" campaign.
 *
 * The admin stat card and the bulk-send route both build on the helpers here so
 * the advertised recipient count can never drift from who actually receives the
 * campaign.
 */

/** Fields `calculateCompleteness` scores. Selecting them keeps the query cheap. */
const completenessSelect = {
  bio: true,
  skills: true,
  hourlyRate: true,
  country: true,
  stateRegion: true,
  languages: true,
  education: true,
} as const;

export type IncompleteProfile = {
  bio: string | null;
  skills: unknown;
  hourlyRate: string | null;
  country: string | null;
  stateRegion: string | null;
  languages: string | null;
  education: string | null;
};

function isIncomplete(profile: IncompleteProfile | null): boolean {
  // A missing profile scores 0 inside `calculateCompleteness`, so this also
  // covers experts who never created one.
  return calculateCompleteness(profile) < 100;
}

/**
 * Experts whose profile is not yet fully complete AND who have not opted out of
 * marketing email. Registration always creates a profile with `emailUpdates`
 * defaulting to true, so accounts without one are treated as opted in.
 */
const recipientWhere = {
  role: "EXPERT" as const,
  OR: [
    { expertProfile: null },
    { expertProfile: { emailUpdates: true } },
  ],
};

export async function findIncompleteExpertProfiles() {
  const users = await prisma.user.findMany({
    where: recipientWhere,
    select: {
      id: true,
      email: true,
      expertProfile: { select: { ...completenessSelect, emailUpdates: true } },
    },
  });

  return users.filter((user) =>
    isIncomplete({
      bio: user.expertProfile?.bio ?? null,
      skills: user.expertProfile?.skills ?? null,
      hourlyRate: user.expertProfile?.hourlyRate ?? null,
      country: user.expertProfile?.country ?? null,
      stateRegion: user.expertProfile?.stateRegion ?? null,
      languages: user.expertProfile?.languages ?? null,
      education: user.expertProfile?.education ?? null,
    }),
  );
}

/** Count only — the stat card should not pull every record just to show a number. */
export async function countIncompleteExpertProfiles(): Promise<number> {
  const users = await prisma.user.findMany({
    where: recipientWhere,
    select: {
      expertProfile: { select: { ...completenessSelect, emailUpdates: true } },
    },
  });

  return users.filter((user) =>
    isIncomplete({
      bio: user.expertProfile?.bio ?? null,
      skills: user.expertProfile?.skills ?? null,
      hourlyRate: user.expertProfile?.hourlyRate ?? null,
      country: user.expertProfile?.country ?? null,
      stateRegion: user.expertProfile?.stateRegion ?? null,
      languages: user.expertProfile?.languages ?? null,
      education: user.expertProfile?.education ?? null,
    }),
  ).length;
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

export function buildReengagementEmail({
  subject,
  message,
  siteUrl,
}: {
  subject: string;
  message: string;
  siteUrl: string;
}) {
  const profileUrl = `${siteUrl.replace(/\/+$/, "")}/dashboard/edit`;

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
                  Action needed
                </p>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;color:#0f172a;">
                  Finish your expert profile
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
                  Your profile is not quite finished yet. Companies can only shortlist and
                  apply to experts whose profiles are complete, so the last few fields are
                  what stand between you and those applications.
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
                        Complete my profile
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
                  You are receiving this because you registered on our platform and have
                  not completed your expert profile.
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
    "Finish your expert profile",
    "",
    "Your profile is not quite finished yet. Companies can only shortlist and apply to experts whose profiles are complete, so the last few fields are what stand between you and those applications.",
    "",
    message.trim(),
    "",
    `Complete my profile: ${profileUrl}`,
  ].join("\n");

  return { html, text };
}