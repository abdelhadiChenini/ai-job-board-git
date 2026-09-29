import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import FaqAccordion from "@/components/FaqAccordion";
import { DEFAULT_FAQ, parseFaqContent } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
};

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const pageData = await prisma.page.findUnique({
    where: { slug: "faq" },
  });

  const items = parseFaqContent(pageData?.content);
  const faqItems = items.length > 0 ? items : DEFAULT_FAQ;

  return (
    <>
      <section className="flex flex-col items-center gap-3 pb-10 text-center sm:pb-16">
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

      <section className="pb-16">
        <FaqAccordion items={faqItems} />
      </section>
    </>
  );
}