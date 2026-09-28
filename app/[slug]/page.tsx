import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params: p }: Params): Promise<Metadata> {
  const params = await p;
  const page = await prisma.page.findUnique({
    where: { slug: params.slug },
  });

  if (!page) {
    return { title: "Page not found" };
  }

  return {
    title: page.title,
  };
}

export default async function CmsPage({ params: p }: Params) {
  const params = await p;
  const pageData = await prisma.page.findUnique({
    where: { slug: params.slug },
  });

  if (!pageData) {
    notFound();
  }

  return (
    <div className="min-h-screen px-6 py-20 mx-auto max-w-4xl">
      <h1 className="mb-8 text-4xl font-bold text-slate-100">
        {pageData.title}
      </h1>
      <div
        className="prose prose-invert prose-lg max-w-none whitespace-pre-wrap leading-relaxed text-slate-300"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(pageData.content, {
            ADD_ATTR: ["target", "rel"],
          }),
        }}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";