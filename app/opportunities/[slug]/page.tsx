import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import JobCard from "@/app/components/JobCard";
import { ShareJobButton } from "./ShareJobButton";
import { NewsletterForm } from "./NewsletterForm";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const job = await prisma.jobOffer.findUnique({
    where: { slug: params.slug },
    include: { platform: { select: { name: true } } },
  });

  if (!job) {
    return { title: "Opportunity" };
  }

  return {
    title: job.title,
    description: excerpt(job.description),
    openGraph: { title: job.title, description: excerpt(job.description) },
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

function plainText(value: string): string {
  return value.replace(/<[^>]*>/g, "");
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

function buildJsonLd(job: NonNullable<Awaited<ReturnType<typeof fetchJob>>>, url: string) {
  const postedDate = (job.datePosted ?? job.createdAt).toISOString().slice(0, 10);
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
    hiringOrganization: {
      "@type": "Organization",
      name: job.aiLabName,
      ...(job.platform.websiteUrl ? { sameAs: job.platform.websiteUrl } : {}),
    },
    jobLocationType: job.jobLocationType,
    ...(salary ? { baseSalary: salary } : {}),
    ...(url ? { url } : {}),
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

export default async function OpportunityPage({ params }: Params) {
  const job = await fetchJob(params.slug);

  if (!job) {
    notFound();
  }

  const tags = toTagList(job.tags);
  const jsonLd = buildJsonLd(job, `/opportunities/${job.slug}`);
  const { related, trending } = await fetchRelatedAndTrending(job);
  const location =
    job.region || (job.jobLocationType === "Remote" ? "Remote" : "Global");

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="full-bleed w-full border-b border-slate-800 bg-slate-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/opportunities"
            className="mb-6 inline-block text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to opportunities
          </Link>

          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-2">
              {job.platform.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.platform.logoUrl}
                  alt={job.platform.name}
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

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          <div className="mb-8 grid grid-cols-3 divide-x divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Work Type</p>
              <p className="mt-1 font-medium text-slate-200">{job.jobLocationType}</p>
            </div>
            <div className="pl-6">
              <p className="text-xs font-semibold uppercase text-slate-500">Location</p>
              <p className="mt-1 font-medium text-slate-200">{location}</p>
            </div>
            <div className="pl-6">
              <p className="text-xs font-semibold uppercase text-slate-500">Compensation</p>
              <p className="mt-1 font-medium text-slate-200">{formatRate(job)}</p>
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
            <a
              href={job.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Apply Now
            </a>
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
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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