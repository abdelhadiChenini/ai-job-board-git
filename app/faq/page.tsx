import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
};

export const dynamic = "force-dynamic";

const DEFAULT_FAQ = `What is this platform?
AI Job Board curates remote work and freelance opportunities from the world's leading AI labs and platforms.

How do I apply for roles?
Open an opportunity and follow its affiliate link. Each listing directs you to the official application page on the partner platform.

Are the listed opportunities free to join?
Yes. Browsing and applying through our curated listings is completely free.

Do I need to create an account?
You can browse public listings without an account. Creating a free account lets you save opportunities and manage your expert profile.

How can I get my opportunities listed?
Reach out through the contact link available in the footer and our team will help you get started.`;

export default async function FaqPage() {
  const page = await prisma.page.findUnique({ where: { slug: "faq" } });

  const rawContent = page?.content?.trim() ? page.content : DEFAULT_FAQ;
  const paragraphs = rawContent
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      <section className="flex flex-col items-center gap-3 py-10 text-center sm:py-16">
        <p className="rounded-full border border-white/10 bg-navy-light px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-300">
          Need help?
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="max-w-2xl text-base text-slate-400">
          Answers to the most common questions about finding AI work, applying
          and getting listed on AI Job Board.
        </p>
      </section>

      <section className="-mx-4 my-8 bg-paper px-4 py-16 sm:-mx-6 sm:px-6">
        <div className="prose prose-slate mx-auto max-w-3xl">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </section>
    </>
  );
}