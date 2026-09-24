import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { prisma } from "@/lib/prisma";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
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

export default async function CmsPage({ params }: Params) {
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
        className="prose prose-invert prose-lg max-w-none leading-relaxed text-slate-300"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(pageData.content) }}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";