import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Blog & Resources",
};

export const revalidate = 60;

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      publishedAt: true,
      createdAt: true,
      featuredImage: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-slate-100">
        Blog & Resources
      </h1>
      <p className="mb-8 text-slate-400">
        Insights, tutorials, and updates from the AI job market.
      </p>

      {posts.length === 0 ? (
        <div className="rounded-card border border-slate-800 bg-slate-900/40 p-10 text-center">
          <p className="text-lg font-semibold text-slate-100">
            No posts published yet
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Check back soon for insights from the AI job market.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block bg-slate-900/40 border border-slate-800 rounded-2xl p-6 transition-colors hover:border-slate-700"
            >
              {post.featuredImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.featuredImage}
                  alt=""
                  className="mb-4 h-44 w-full rounded-xl object-cover"
                />
              )}
              <h2 className="mb-2 text-xl font-bold text-slate-100">
                {post.title}
              </h2>
              <p className="mb-4 text-sm text-slate-400 line-clamp-3">
                {post.excerpt}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(post.publishedAt ?? post.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}