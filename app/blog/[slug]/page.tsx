import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  if (!post) {
    return { title: "Article" };
  }
  return {
    title: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

function fetchPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, published: true },
    include: {
      author: { select: { email: true, expertProfile: { select: { fullName: true } } } },
    },
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: Params) {
  const post = await fetchPost(params.slug);

  if (!post) {
    notFound();
  }

  const authorName = post.author.expertProfile?.fullName ?? post.author.email;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.metaDescription,
    datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `/blog/${post.slug}`,
    },
    author: {
      "@type": "Person",
      name: authorName,
    },
  };

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {post.featuredImage && (
        <img
          src={post.featuredImage}
          alt=""
          className="w-full rounded-card border border-white/10 object-cover"
        />
      )}

      <section className="rounded-card border border-white/10 bg-slate-800 p-6 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-slate-400">
          By <span className="font-semibold text-slate-200">{authorName}</span>
          {" · "}
          {formatDate(post.publishedAt ?? post.createdAt)}
        </p>
        {post.excerpt && (
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            {post.excerpt}
          </p>
        )}
      </section>

      <section className="rounded-card bg-white p-6 shadow-2xl sm:p-8">
        <div
          className="prose prose-slate prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </section>
    </article>
  );
}