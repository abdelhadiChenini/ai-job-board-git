import { normalizePlan } from "@/lib/subscription";

/**
 * Experts shown per page in the public directory grid.
 *
 * The grid is two columns on desktop, so 12 keeps every page a whole number of
 * full rows (6 rows) and avoids a lonely trailing card.
 */
export const EXPERTS_PAGE_SIZE = 12;

/**
 * The subset of an expert profile that decides its directory ranking.
 *
 * Kept deliberately small so the ordering rules can be unit-tested without a
 * database: the page selects exactly these fields, hands them to
 * `compareExperts`, and the function stays pure.
 */
export type ExpertOrderingProfile = {
  bio: string | null;
  skills: unknown;
  linkedin: string | null;
  linkedInUrl: string | null;
  github: string | null;
  githubUrl: string | null;
  website: string | null;
  websiteUrl: string | null;
  xUrl: string | null;
  twitterUrl: string | null;
  youtube: string | null;
  updatedAt: Date;
  createdAt: Date;
  user: {
    isFeatured: boolean;
    plan: string | null;
    paypalSubscriptionId: string | null;
  };
};

/**
 * 1 = paying (top), 2 = complete free profile (middle), 3 = the rest (bottom).
 */
export type ExpertTier = 1 | 2 | 3;

function isFilled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function skillList(skills: unknown): string[] {
  if (!Array.isArray(skills)) {
    return [];
  }
  return skills.filter(
    (skill): skill is string => typeof skill === "string" && skill.trim().length > 0,
  );
}

/**
 * A paid plan or a live PayPal subscription both count as "paying". The stored
 * plan is the fast path; the subscription id covers records that still hold an
 * entitlement while the plan column lags behind.
 */
export function hasActiveSubscription(
  user: ExpertOrderingProfile["user"],
): boolean {
  return normalizePlan(user.plan) === "PRO" || isFilled(user.paypalSubscriptionId);
}

/**
 * "Complete" means the card has something substantive to show: a bio, at least
 * one skill, and at least one link (resume/portfolio/social). Any one of these
 * missing drops the profile to the bottom tier.
 */
export function hasCompletedProfile(expert: ExpertOrderingProfile): boolean {
  const hasBio = isFilled(expert.bio);
  const hasSkills = skillList(expert.skills).length > 0;
  const hasLink = [
    expert.linkedin,
    expert.linkedInUrl,
    expert.github,
    expert.githubUrl,
    expert.website,
    expert.websiteUrl,
    expert.xUrl,
    expert.twitterUrl,
    expert.youtube,
  ].some(isFilled);

  return hasBio && hasSkills && hasLink;
}

export function getExpertTier(expert: ExpertOrderingProfile): ExpertTier {
  if (hasActiveSubscription(expert.user)) {
    return 1;
  }
  if (hasCompletedProfile(expert)) {
    return 2;
  }
  return 3;
}

/**
 * Total order for the directory: paying experts first, then completed profiles,
 * then everyone else. Within a tier the most recently updated profile leads;
 * `createdAt` and the curated featured flag break remaining ties so the order
 * is stable from page to page.
 */
export function compareExperts(
  a: ExpertOrderingProfile,
  b: ExpertOrderingProfile,
): number {
  const tierDiff = getExpertTier(a) - getExpertTier(b);
  if (tierDiff !== 0) {
    return tierDiff;
  }

  const updatedDiff = b.updatedAt.getTime() - a.updatedAt.getTime();
  if (updatedDiff !== 0) {
    return updatedDiff;
  }

  const createdDiff = b.createdAt.getTime() - a.createdAt.getTime();
  if (createdDiff !== 0) {
    return createdDiff;
  }

  if (a.user.isFeatured !== b.user.isFeatured) {
    return a.user.isFeatured ? -1 : 1;
  }

  return 0;
}
