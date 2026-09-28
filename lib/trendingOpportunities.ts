import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TrendingFilters = {
  q?: string;
  category?: string;
  company?: string;
  location?: string;
};

const TRENDING_POOL_SIZE = 30;
const DIVERSE_RESULT_SIZE = 12;

export function buildTrendingWhere({
  q,
  category,
  company,
  location,
}: TrendingFilters): Prisma.JobOfferWhereInput {
  const where: Prisma.JobOfferWhereInput = {};

  if (q) {
    where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
  }
  if (company) {
    where.platform = { name: company };
  }
  if (category) {
    where.tags = { array_contains: category };
  }
  if (location) {
    where.jobLocationType = location;
  }

  return where;
}

export function selectDiverseOpportunities<T extends { platformId: string }>(
  opportunities: T[],
): T[] {
  const usedPlatformIds = new Set<string>();

  return opportunities
    .filter((opportunity) => {
      if (usedPlatformIds.has(opportunity.platformId)) {
        return false;
      }
      usedPlatformIds.add(opportunity.platformId);
      return true;
    })
    .slice(0, DIVERSE_RESULT_SIZE);
}

export async function fetchTrendingOpportunities(filters: TrendingFilters) {
  const pool = await prisma.jobOffer.findMany({
    include: {
      platform: { select: { name: true, slug: true, logoUrl: true } },
    },
    where: { ...buildTrendingWhere(filters), badge: "Trending" },
    orderBy: { createdAt: "desc" },
    take: TRENDING_POOL_SIZE,
  });

  return selectDiverseOpportunities(pool);
}
