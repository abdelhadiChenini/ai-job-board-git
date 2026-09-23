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
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/25 via-slate-900 to-emerald-500/15 p-6 sm:p-10">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(500px 300px at 90% -10%, rgba(56,189,248,0.14), transparent 60%)",
          }}
        />
        <div className="relative">
          <Link
            href={`/platforms`}
            className="text-xs font-semibold uppercase tracking-wide text-accent hover:text-blue-300"
          >
            {job.platform.name}
          </Link>
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {job.title}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            at{" "}
            <span className="font-semibold text-white">{job.aiLabName}</span>
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
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              About the role
            </h2>
            <div className="prose prose-invert prose-sm mt-4 max-w-none whitespace-pre-line leading-relaxed text-slate-300">
              {job.description ||
                "This opportunity is hiring now — apply to learn more."}
            </div>
          </section>
        </div>

        <aside className="min-w-0">
          <div className="sticky top-24 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <a
              href={job.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Apply on {job.platform.name} <span className="ml-1">↗</span>
            </a>

            <dl className="mt-6 flex flex-col gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rate
                </dt>
                <dd className="mt-1 text-lg font-bold text-white">
                  {formatRate(job)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Posted
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">
                  {formatDate(job.datePosted ?? job.createdAt)}
                </dd>
              </div>
            </dl>

            {tags.length > 0 && (
              <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tags
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}