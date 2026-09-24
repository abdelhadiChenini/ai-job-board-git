import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAdminSession } from "@/lib/admin";

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized." },
  { status: 401 },
);

const CONTEXT_TYPES = ["opportunity", "blog", "email"] as const;
type ContextType = (typeof CONTEXT_TYPES)[number];

const SYSTEM_PROMPTS: Record<ContextType, string> = {
  opportunity:
    "You are an expert AI recruiter writing job descriptions for an AI job board. " +
    "Write a professional, well-structured job description that is ready to be pasted into a rich text editor. " +
    "Use HTML formatting: <h2> for section headings and <ul>/<li> for bullet points, plus <p> for paragraphs. " +
    'Do NOT wrap the output in <html>, <body>, or markdown code fences. Do not invent salary figures or company names beyond what the user asks for. ' +
    "Match the tone to the role described by the user.",
  blog:
    "You are a professional technology blogger writing for an AI job board that helps readers find remote AI roles " +
    "(AI training, data annotation, and model evaluation). " +
    "Write an engaging, well-structured blog article in HTML ready to be pasted into a rich text editor. " +
    "Use <h2> for section headings, <ul>/<li> for bullet points, and <p> for paragraphs. " +
    'Do NOT wrap the output in <html>, <body>, or markdown code fences.',
  email:
    "You are a warm, professional customer support writer for an AI job board. " +
    "Write a polite and concise email reply in plain text, using line breaks for readability. " +
    "Do not use HTML tags or markdown. Match the tone to the message being replied to.",
};

export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) {
    return UNAUTHORIZED;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const prompt =
    body &&
    typeof body === "object" &&
    "prompt" in body &&
    typeof body.prompt === "string"
      ? body.prompt.trim()
      : "";

  const contextType =
    body &&
    typeof body === "object" &&
    "contextType" in body &&
    typeof body.contextType === "string" &&
    CONTEXT_TYPES.includes(body.contextType as ContextType)
      ? (body.contextType as ContextType)
      : null;

  if (!prompt) {
    return NextResponse.json(
      { error: "A prompt is required." },
      { status: 400 },
    );
  }

  if (!contextType) {
    return NextResponse.json(
      { error: "contextType must be one of: opportunity, blog, email." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured." },
      { status: 500 },
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS[contextType] },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const text = completion.choices[0]?.message?.content ?? "";

    if (!text) {
      return NextResponse.json(
        { error: "The AI did not return any content." },
        { status: 502 },
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI generation failed:", error);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 502 },
    );
  }
}