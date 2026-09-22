import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
    description: job.description.slice(0, 160),
    openGraph: { title: job.title, description: job.description.slice(0, 160) },
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
    description: job.description,
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

async function fetchJob(slug: string) {
  return prisma.jobOffer.findUnique({
    where: { slug },
    include: { platform: { select: { name: true, slug: true, websiteUrl: true } } },
  });
}

export default async function OpportunityPage({ params }: Params) {
  const job = await fetchJob(params.slug);

  if (!job) {
    notFound();
  }

  const tags = Array.isArray(job.tags)
    ? job.tags.map((tag) => String(tag))
    : [];
  const jsonLd = buildJsonLd(job, `/opportunities/${job.slug}`);
  const offerSummary = [
    { label: "Company", value: job.aiLabName },
    {
      label: "Posted",
      value: formatDate(job.datePosted ?? job.createdAt),
    },
    { label: "Job type", value: job.jobLocationType },
    ...(job.salaryMin !== null || job.salaryMax !== null
      ? [
          {
            label: "Salary",
            value: `$${job.salaryMin ?? ""}${job.salaryMin !== null && job.salaryMax !== null ? " – " : ""}${job.salaryMax ?? ""} ${job.currency}`,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="rounded-card border border-white/10 bg-slate-800 p-6 sm:p-8">
        <Link
          href="/platforms"
          className="text-xs font-semibold uppercase tracking-wide text-blue-400 hover:text-blue-300"
        >
          {job.platform.name}
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          {job.title}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          at <span className="font-semibold text-slate-200">{job.aiLabName}</span>
        </p>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
          {offerSummary.map((row) => (
            <div key={row.label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-200">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-600/15 px-2.5 py-1 text-xs font-semibold text-blue-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <a
          href={job.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Apply on {job.platform.name} <span className="ml-1">↗</span>
        </a>
      </section>

      <section className="rounded-card bg-white p-6 shadow-2xl sm:p-8">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          About the role
        </h2>
        <div className="prose prose-slate prose-sm mt-4 whitespace-pre-line leading-relaxed text-slate-700">
          {job.description || "This opportunity is hiring now — apply to learn more."}
        </div>
      </section>
    </div>
  );
}