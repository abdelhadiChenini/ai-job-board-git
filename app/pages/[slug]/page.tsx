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

export default async function PublicPage({ params }: Params) {
  const page = await prisma.page.findUnique({
    where: { slug: params.slug },
  });

  if (!page) {
    notFound();
  }

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-12">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {page.title}
        </h1>
        <p className="text-sm text-slate-500">
          Last updated {page.updatedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <div
        className="prose prose-invert prose-lg max-w-none leading-relaxed text-slate-300"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
      />
    </article>
  );
}

export const dynamic = "force-dynamic";