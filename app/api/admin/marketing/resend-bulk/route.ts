import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminSession, readJsonBody } from "@/lib/admin";
import { findIncompleteExpertProfiles, buildReengagementEmail } from "@/lib/marketing";

export const dynamic = "force-dynamic";

/** Resend's batch endpoint accepts at most 100 emails per call. */
const BATCH_SIZE = 100;

const MAX_SUBJECT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 5000;

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized." },
  { status: 401 },
);

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!subject) {
    return NextResponse.json(
      { error: "A subject line is required." },
      { status: 400 },
    );
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json(
      { error: `Subject line must be ${MAX_SUBJECT_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }
  if (!message) {
    return NextResponse.json(
      { error: "A message body is required." },
      { status: 400 },
    );
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Resend is not configured. Set RESEND_API_KEY (and RESEND_FROM_EMAIL) to enable campaigns.",
      },
      { status: 503 },
    );
  }

  // Resend only accepts senders on a domain that has been verified in its
  // dashboard, so the from address cannot be assumed from the SMTP settings.
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    return NextResponse.json(
      {
        error:
          "No sender configured. Set RESEND_FROM_EMAIL to a verified Resend domain.",
      },
      { status: 503 },
    );
  }

  const recipients = await findIncompleteExpertProfiles();
  if (recipients.length === 0) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      batches: 0,
      message: "No incomplete expert profiles matched. Nothing was sent.",
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { html, text } = buildReengagementEmail({ subject, message, siteUrl });

  const resend = new Resend(apiKey);

  let sent = 0;
  let failed = 0;

  for (const batch of chunk(recipients, BATCH_SIZE)) {
    const { data, error } = await resend.batch.send(
      batch.map((recipient) => ({
        from,
        to: recipient.email,
        subject,
        html,
        text,
        tags: [
          { name: "campaign", value: "incomplete-profile-reengagement" },
        ],
      })),
    );

    if (error) {
      // One failed batch must not abort the rest of the campaign, but the
      // shortfall has to be reported back to the admin rather than swallowed.
      failed += batch.length;
      console.error("[resend-bulk] batch failed:", error);
      continue;
    }

    sent += data ? batch.length : 0;
  }

  return NextResponse.json({
    sent,
    failed,
    batches: Math.ceil(recipients.length / BATCH_SIZE),
    message:
      failed > 0
        ? `Sent ${sent} of ${recipients.length} emails. ${failed} failed — check the server logs.`
        : `Sent ${sent} of ${recipients.length} emails.`,
  });
}