import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, readJsonBody } from "@/lib/admin";
import { sendEmail } from "@/lib/mailer";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const to = typeof body.to === "string" ? body.to.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const html = typeof body.html === "string" ? body.html.trim() : "";

  if (!to || !EMAIL_PATTERN.test(to)) {
    return NextResponse.json(
      { error: "A valid recipient email is required." },
      { status: 400 },
    );
  }
  if (!subject) {
    return NextResponse.json(
      { error: "A subject is required." },
      { status: 400 },
    );
  }
  if (!html) {
    return NextResponse.json(
      { error: "A message body is required." },
      { status: 400 },
    );
  }

  try {
    await sendEmail({ to, subject, html });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      {
        error:
          "Could not send the email. Check the SMTP settings in Settings → SMTP.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}