import Link from "next/link";

export type OpportunityFilters = {
  q?: string;
  category?: string;
  region?: string;
  platform?: string;
};

/**
 * Rebuilds the opportunities URL for a target page, carrying every active
 * filter across so paging never drops the user's search. `page` is omitted
 * when targeting the first page to keep the default URL clean.
 */
function buildPageHref(filters: OpportunityFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.region) params.set("region", filters.region);
  if (filters.platform) params.set("platform", filters.platform);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/opportunities?${query}` : "/opportunities";
}

const enabledClass =
  "inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-accent/50 hover:text-white";

const disabledClass =
  "inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/5 bg-slate-900/40 px-5 py-2.5 text-sm font-semibold text-slate-500 opacity-50";

export default function Pagination({
  page,
  totalPages,
  filters,
}: {
  page: number;
  totalPages: number;
  filters: OpportunityFilters;
}) {
  if (totalPages <= 1) return null;

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Opportunities pagination"
      className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6"
    >
      {hasPrevious ? (
        <Link
          href={buildPageHref(filters, page - 1)}
          rel="prev"
          className={enabledClass}
        >
          <span aria-hidden="true">&larr;</span>
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          <span aria-hidden="true">&larr;</span>
          Previous
        </span>
      )}

      <span aria-live="polite" className="text-sm font-medium text-slate-400">
        Page {page} of {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={buildPageHref(filters, page + 1)}
          rel="next"
          className={enabledClass}
        >
          Next
          <span aria-hidden="true">&rarr;</span>
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          Next
          <span aria-hidden="true">&rarr;</span>
        </span>
      )}
    </nav>
  );
}
