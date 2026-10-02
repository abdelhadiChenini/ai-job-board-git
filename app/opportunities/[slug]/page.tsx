import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canApplyToJob,
  formatUnlockCountdown,
  getEarlyAccessUnlockAt,
  type ApplyBlockInfo,
} from "@/lib/subscription";
import JobCard from "@/app/components/JobCard";
import { ShareJobButton } from "./ShareJobButton";
import { NewsletterForm } from "./NewsletterForm";
import { OpportunityActions } from "./OpportunityActions";
import ProLockedNotice from "@/components/ProLockedNotice";
import SafeImage from "@/components/SafeImage";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

export async function generateMetadata({ params: p }: Params): Promise<Metadata> {
  const params = await p;
  const job = await fetchJob(params.slug);

  if (!job) {
    return {
      title: "Opportunity not found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${job.title} at ${job.platform.name}`;
  const description = excerpt(job.description);

  return {
    title,
    description,
    keywords: toTagList(job.tags),
    alternates: { canonical: `/opportunities/${job.slug}` },
    openGraph: { title, description },
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
};

function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(#[0-9]+|[a-z]+);/gi,
      (match) => HTML_ENTITIES[match.toLowerCase()] ?? match,
    )
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(value: string): string {
  return plainText(value).slice(0, 160);
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

type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACTOR"
  | "TEMPORARY"
  | "INTERN";

const EMPLOYMENT_TYPE_RULES: ReadonlyArray<[RegExp, EmploymentType]> = [
  [/\b(intern|internship)\b/i, "INTERN"],
  [/\bpart[\s-]?time\b/i, "PART_TIME"],
  [/\b(temporary|temp)\b/i, "TEMPORARY"],
  [/\b(contract|contractor|freelance)\b/i, "CONTRACTOR"],
];

function toEmploymentType(job: {
  title: string;
  tags: unknown;
}): EmploymentType {
  const haystack = `${job.title} ${toTagList(job.tags).join(" ")}`;

  for (const [pattern, employmentType] of EMPLOYMENT_TYPE_RULES) {
    if (pattern.test(haystack)) {
      return employmentType;
    }
  }

  return "FULL_TIME";
}

function toJobLocationType(
  value: string,
): "TELECOMMUTE" | "HYBRID" | "ONSITE" {
  const normalized = value.trim().toLowerCase();

  if (normalized.includes("hybrid")) return "HYBRID";
  if (normalized.includes("remote") || normalized.includes("telecommute")) {
    return "TELECOMMUTE";
  }

  return "ONSITE";
}

function toCountryCode(region: string | null): string | null {
  const value = region?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(value) ? value : null;
}

const REGION_COUNTRY_NAMES: Record<string, string> = {
  us: "United States",
  usa: "United States",
  "united states": "United States",
  "united states of america": "United States",
  eu: "European Union",
  europe: "European Union",
  uk: "United Kingdom",
  "united kingdom": "United Kingdom",
  uae: "United Arab Emirates",
  "saudi arabia": "Saudi Arabia",
  ksa: "Saudi Arabia",
  india: "India",
};

const WORLDWIDE_REGIONS = new Set([
  "",
  "global",
  "globals",
  "world",
  "worldwide",
  "anywhere",
  "international",
  "remote",
]);

type ApplicantLocationRequirement =
  | { "@type": "Country"; name: string }
  | Array<{ "@type": "Country"; name: string }>;

function toApplicantLocationRequirements(
  region: string | null,
): ApplicantLocationRequirement {
  const parts = (region ?? "")
    .split(/[,/|]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const names: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const key = part.toLowerCase();
    if (WORLDWIDE_REGIONS.has(key) || seen.has(key)) continue;
    seen.add(key);
    names.push(REGION_COUNTRY_NAMES[key] ?? part);
  }

  if (names.length === 0) {
    return { "@type": "Country", name: "World" };
  }

  if (names.length === 1) {
    return { "@type": "Country", name: names[0] };
  }

  return names.map((name) => ({ "@type": "Country", name }));
}

function buildJsonLd(
  job: NonNullable<Awaited<ReturnType<typeof fetchJob>>>,
  path: string,
) {
  const postedAt = job.datePosted ?? job.createdAt;
  const postedDate = postedAt.toISOString().slice(0, 10);
  const validThrough = new Date(
    postedAt.getTime() + 30 * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);
  const countryCode = toCountryCode(job.region);
  const salary =
    job.salaryMin !== null || job.salaryMax !== null
      ? {
          "@type": "MonetaryAmount" as const,
          currency: job.currency,
          value: {
            "@type": "QuantitativeValue" as const,
            ...(job.salaryMin !== null ? { minValue: job.salaryMin } : {}),
            ...(job.salaryMax !== null ? { maxValue: job.salaryMax } : {}),
          },
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: plainText(job.description),
    datePosted: postedDate,
    validThrough,
    employmentType: toEmploymentType(job),
    hiringOrganization: {
      "@type": "Organization",
      name: job.platform.name || job.aiLabName,
      ...(job.platform.websiteUrl ? { sameAs: job.platform.websiteUrl } : {}),
    },
    jobLocationType: toJobLocationType(job.jobLocationType),
    applicantLocationRequirements: toApplicantLocationRequirements(job.region),
    ...(countryCode
      ? {
          jobLocation: {
            "@type": "Place",
            address: { "@type": "PostalAddress", addressCountry: countryCode },
          },
        }
      : {}),
    ...(salary ? { baseSalary: salary } : {}),
    ...(SITE_URL ? { url: `${SITE_URL}${path}` } : {}),
  };
}

type JobRow = {
  id: string;
  platformId: string;
  title: string;
  aiLabName: string;
  tags: unknown;
  region: string | null;
  jobLocationType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  affiliateUrl: string;
  createdAt: Date;
  platform: { name: string; slug: string; websiteUrl: string | null; logoUrl: string | null };
};

async function fetchJob(slug: string) {
  return prisma.jobOffer.findUnique({
    where: { slug },
    include: { platform: { select: { name: true, slug: true, websiteUrl: true, logoUrl: true } } },
  });
}

async function fetchRelatedAndTrending(job: JobRow) {
  const [related, trending] = await Promise.all([
    prisma.jobOffer.findMany({
      where: { platformId: job.platformId, NOT: { id: job.id } },
      include: { platform: { select: { name: true, slug: true, logoUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.jobOffer.findMany({
      where: { NOT: { id: job.id } },
      include: { platform: { select: { name: true, slug: true, logoUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);
  return { related, trending };
}

function toTagList(tags: unknown): string[] {
  return Array.isArray(tags) ? tags.map((tag) => String(tag)) : [];
}

export default async function OpportunityPage({ params: p }: Params) {
  const params = await p;
  const job = await fetchJob(params.slug);

  if (!job) {
    notFound();
  }

  const tags = toTagList(job.tags);
  const jsonLd = buildJsonLd(job, `/opportunities/${job.slug}`);
  const { related, trending } = await fetchRelatedAndTrending(job);
  const location = job.region?.trim() || "Global";

  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id;

  let saved = false;
  let applied = false;
  let savedIds = new Set<string>();
  if (viewerId) {
    const [savedRow, appliedRow, savedRows] = await Promise.all([
      prisma.savedOpportunity.findUnique({
        where: {
          userId_opportunityId: { userId: viewerId, opportunityId: job.id },
        },
      }),
      prisma.appliedOpportunity.findUnique({
        where: {
          userId_opportunityId: { userId: viewerId, opportunityId: job.id },
        },
      }),
      prisma.savedOpportunity.findMany({
        where: { userId: viewerId },
        select: { opportunityId: true },
      }),
    ]);
    saved = Boolean(savedRow);
    applied = Boolean(appliedRow);
    savedIds = new Set(savedRows.map((row) => row.opportunityId));
  }

  // Users who already applied keep full access — the paywall only gates the
  // first application, so a lock appearing later must not strand them.
  let applyBlock: ApplyBlockInfo | null = null;
  if (viewerId && !applied) {
    const eligibility = await canApplyToJob(viewerId, job.id);

    if (!eligibility.allowed) {
      applyBlock =
        eligibility.reason === "early_access"
          ? {
              reason: "early_access",
              unlocksAt: eligibility.unlocksAt.toISOString(),
              countdown: formatUnlockCountdown(eligibility.unlocksAt, new Date()),
            }
          : {
              reason: "daily_limit",
              used: eligibility.used,
              limit: eligibility.limit,
            };
    }
  }

  const loginHref = `/login?callbackUrl=${encodeURIComponent(
    `/opportunities/${job.slug}`,
  )}`;

  // A signed-out visitor has no tier to test, but they must not be able to walk
  // around the early-access window by staying logged out — the window is a
  // property of the opportunity, not of who is looking. Resolve the window on
  // its own and ask them to authenticate; from there their real Free/Pro tier is
  // what decides, which is exactly the answer the gate would have given.
  const now = new Date();
  const anonymousUnlockAt = getEarlyAccessUnlockAt(job);
  const anonymousEarlyAccess: ApplyBlockInfo | null =
    now.getTime() < anonymousUnlockAt.getTime()
      ? {
          reason: "early_access",
          unlocksAt: anonymousUnlockAt.toISOString(),
          countdown: formatUnlockCountdown(anonymousUnlockAt, now),
        }
      : null;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="full-bleed w-full border-b border-slate-800 bg-slate-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-12 lg:px-20">
          <Link
            href="/opportunities"
            className="mb-6 inline-block text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to opportunities
          </Link>

          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-2">
              {job.platform.logoUrl ? (
                 
                <SafeImage
                  src={job.platform.logoUrl}
                  alt={job.platform.name}
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-xl font-bold text-slate-400">
                  {job.platform.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-slate-100 lg:text-4xl">{job.title}</h1>
              <p className="mt-2 flex items-center gap-4 text-slate-400">
                <span>{job.platform.name}</span>
                <span className="inline-block h-1 w-1 rounded-full bg-slate-700" />
                <span>Posted {formatDate(job.datePosted ?? job.createdAt)}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:grid-cols-3 sm:divide-x sm:gap-0 sm:divide-slate-800">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500">Work Type</p>
              <p className="mt-1 break-words font-medium text-slate-200">{job.jobLocationType}</p>
            </div>
            <div className="min-w-0 sm:pl-6">
              <p className="text-xs font-semibold uppercase text-slate-500">Location</p>
              <p className="mt-1 break-words font-medium text-slate-200">{location}</p>
            </div>
            <div className="min-w-0 sm:pl-6">
              <p className="text-xs font-semibold uppercase text-slate-500">Compensation</p>
              <p className="mt-1 break-words font-medium text-slate-200">{formatRate(job)}</p>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
            <h2 className="mb-6 text-xl font-bold text-slate-100">About this opportunity</h2>
            {isHtml(job.description) ? (
              <div
                className="prose prose-invert max-w-none prose-headings:text-slate-100 prose-a:text-blue-400 prose-ul:list-disc prose-ul:pl-5"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            ) : (
              <div className="max-w-none space-y-6 whitespace-pre-line leading-relaxed text-slate-300">
                {job.description || "This opportunity is hiring now — apply to learn more."}
              </div>
            )}
          </section>
        </div>

        <aside>
          <div className="sticky top-24 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="text-lg font-bold text-slate-100">Interested in this role?</h2>
            <p className="mb-6 mt-2 text-sm text-slate-400">
              Review the details carefully, then apply directly on the hiring platform.
            </p>
            {viewerId ? (
              <OpportunityActions
                jobId={job.id}
                affiliateUrl={job.affiliateUrl}
                initialSaved={saved}
                initialApplied={applied}
                applyBlock={applyBlock}
              />
            ) : anonymousEarlyAccess ? (
              <>
                <ProLockedNotice block={anonymousEarlyAccess} />
                <Link
                  href={loginHref}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  Log in or Sign up to apply
                </Link>
                <p className="text-center text-xs text-slate-400">
                  Applying needs an account — your plan decides whether this
                  role is available to you now.
                </p>
              </>
            ) : (
              <>
                <a
                  href={job.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  Apply Now
                </a>
                <Link
                  href={loginHref}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 py-3 font-semibold text-slate-300 transition-colors hover:border-blue-500/50 hover:text-white"
                >
                  Save for Later
                </Link>
              </>
            )}
            <ShareJobButton />

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-500">
              <span aria-hidden="true" className="mt-0.5 shrink-0 text-blue-400">
                🛡
              </span>
              <p>
                We curate opportunities, but applications are completed externally on the hiring
                platform.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {(related.length > 0 || trending.length > 0) && (
        <section className="mx-auto max-w-7xl">
          {related.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-6 text-2xl font-bold text-slate-100">Related Opportunities</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <JobCard
                    key={item.id}
                    title={item.title}
                    labName={item.platform.name}
                    tags={toTagList(item.tags)}
                    url={`/api/redirect?id=${item.id}`}
                    slug={item.slug}
                    location={item.region ?? item.jobLocationType}
                    logoUrl={item.platform.logoUrl}
                    badge={item.badge}
                    jobId={item.id}
                    saved={savedIds.has(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {trending.length > 0 && (
            <div>
              <h2 className="mb-6 text-2xl font-bold text-slate-100">Trending Right Now</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {trending.map((item) => (
                  <JobCard
                    key={item.id}
                    title={item.title}
                    labName={item.platform.name}
                    tags={toTagList(item.tags)}
                    url={`/api/redirect?id=${item.id}`}
                    slug={item.slug}
                    location={item.region ?? item.jobLocationType}
                    logoUrl={item.platform.logoUrl}
                    badge={item.badge}
                    jobId={item.id}
                    saved={savedIds.has(item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mx-auto max-w-4xl">
        <div className="my-16 rounded-3xl border border-blue-900/40 bg-gradient-to-r from-slate-900 to-slate-950 p-10 text-center">
          <h2 className="text-3xl font-bold text-slate-100">Don&apos;t miss the next opportunity</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Join the newsletter to get curated AI roles delivered straight to your inbox, before
            everyone else.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}