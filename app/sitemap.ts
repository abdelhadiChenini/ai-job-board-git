import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
  "https://github.com/abdelhadiChenini/ai-job-board-git";

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

const staticRoutes: Array<{
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/experts", changeFrequency: "weekly", priority: 0.8 },
  { path: "/platforms", changeFrequency: "weekly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
  { path: "/register", changeFrequency: "monthly", priority: 0.4 },
  { path: "/login", changeFrequency: "monthly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobOffers, blogPosts] = await Promise.all([
    prisma.jobOffer.findMany({
      where: { slug: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const now = new Date();

  const statics: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const jobs: MetadataRoute.Sitemap = jobOffers.map((job) => ({
    url: `${SITE_URL}/opportunities/${job.slug}`,
    lastModified: job.updatedAt,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const blogs: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...statics, ...jobs, ...blogs];
}