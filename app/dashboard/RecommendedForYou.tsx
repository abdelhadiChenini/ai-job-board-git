import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  canApplyToJob,
  formatUnlockCountdown,
  type ApplyBlockInfo,
} from "@/lib/subscription";
import GatedApplyButton from "@/components/GatedApplyButton";
import SafeImage from "@/components/SafeImage";

function toTagList(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.filter((tag): tag is string => typeof tag === "string");
}

function formatRate(job: {
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
}): string {
  const currency = job.currency || "USD";
  if (job.salaryMin !== null && job.salaryMax !== null) {
    return `$${job.salaryMin} – $${job.salaryMax} ${currency}`;
  }
  if (job.salaryMin !== null) {
    return `From $${job.salaryMin} ${currency}`;
  }
  if (job.salaryMax !== null) {
    return `Up to $${job.salaryMax} ${currency}`;
  }
  return "Rate on request";
}

function platformInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export async function RecommendedForYou({ skills }: { skills: string[] }) {
  const validSkills = Array.isArray(skills)
    ? skills.filter(
        (skill): skill is string =>
          typeof skill === "string" && skill.trim() !== "",
      )
    : [];

  const select = {
    id: true,
    slug: true,
    title: true,
    aiLabName: true,
    category: true,
    salaryMin: true,
    salaryMax: true,
    currency: true,
    tags: true,
    affiliateUrl: true,
    platform: {
      select: { name: true, logoUrl: true, websiteUrl: true },
    },
  } as const;

  let jobs;
  if (validSkills.length === 0) {
    jobs = await prisma.jobOffer.findMany({
      select,
      orderBy: { createdAt: "desc" },
      take: 4,
    });
  } else {
    jobs = await prisma.jobOffer.findMany({
      where: {
        OR: validSkills.map((skill) => ({
          OR: [
            { tags: { array_contains: skill } },
            { category: { contains: skill } },
          ],
        })),
      },
      select,
      orderBy: { createdAt: "desc" },
      take: 4,
    });
  }

  if (jobs.length === 0) {
    return null;
  }

  // Resolve paywall state up front so a locked role renders its notice and an
  // upgrade path here, instead of offering an Apply button that the server
  // action will refuse a moment later. The client still re-checks on click.
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id;
  const applyBlock = new Map<string, ApplyBlockInfo>();

  if (viewerId) {
    const now = new Date();

    const eligibility = await Promise.all(
      jobs.map(async (job) => {
        try {
          return [job.id, await canApplyToJob(viewerId, job.id)] as const;
        } catch {
          // A job deleted between the listing query and this check should not
          // take the whole recommendation rail down; leave it ungated here and
          // let the apply action be the authority.
          return [job.id, null] as const;
        }
      }),
    );

    for (const [jobId, result] of eligibility) {
      if (result && !result.allowed) {
        applyBlock.set(
          jobId,
          result.reason === "early_access"
            ? {
                reason: "early_access",
                unlocksAt: result.unlocksAt.toISOString(),
                countdown: formatUnlockCountdown(result.unlocksAt, now),
              }
            : {
                reason: "daily_limit",
                used: result.used,
                limit: result.limit,
              },
        );
      }
    }
  }

  return (
    <section className="rounded-card border border-white/10 bg-slate-800 p-6">
      <h2 className="text-lg font-bold tracking-tight text-white">
        Recommended for You
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        {validSkills.length > 0
          ? "Matched to the skills on your profile."
          : "Popular opportunities trending right now."}
      </p>

      <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {jobs.map((job) => {
          const primaryTag = job.category || toTagList(job.tags)[0];
          return (
            <li
              key={job.id}
              className="flex flex-col rounded-xl border border-white/10 bg-slate-900/60 p-5 transition-colors hover:border-blue-500/40"
            >
              <div className="flex items-center gap-3">
                {job.platform.logoUrl ? (
                   
                  <SafeImage
                    src={job.platform.logoUrl}
                    alt={`${job.platform.name} logo`}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-lg border border-white/10 object-contain bg-slate-950 p-0.5"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/15 text-xs font-bold text-blue-400">
                    {platformInitials(job.platform.name)}
                  </span>
                )}
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {job.aiLabName}
                </p>
              </div>

              <h3 className="mt-3 text-sm font-bold leading-snug text-white">
                {job.title}
              </h3>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  {formatRate(job)}
                </span>
                {primaryTag && (
                  <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-400">
                    {primaryTag}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Link
                  href={`/opportunities/${job.slug}`}
                  className="text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300"
                >
                  View details
                </Link>
                <GatedApplyButton
                  jobId={job.id}
                  affiliateUrl={job.affiliateUrl}
                  applyBlock={applyBlock.get(job.id) ?? null}
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default RecommendedForYou;