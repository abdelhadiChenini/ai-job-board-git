import Link from "next/link";

/**
 * Filters carried across pages. Values may repeat (e.g. `?specialty=a&specialty=b`),
 * which is why arrays are first-class here rather than a `URLSearchParams` string.
 */
export type PaginationFilters = Record<
  string,
  string | string[] | undefined
>;

/**
 * Rebuilds the URL for a target page, carrying every active filter so paging
 * never drops the user's search. `page` is omitted on the first page to keep the
 * default URL clean.
 */
function buildPageHref(
  basePath: string,
  filters: PaginationFilters,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (key === "page") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) params.append(key, item);
      }
    } else if (value) {
      params.set(key, value);
    }
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Compact page list: always the first and last page, the current page and its
 * neighbours, with gaps elided. Keeps the control to a handful of links however
 * many pages exist.
 */
function buildPageItems(page: number, totalPages: number): Array<number | "gap"> {
  const visible = new Set<number>([1, totalPages]);
  for (let offset = -1; offset <= 1; offset += 1) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= totalPages) {
      visible.add(candidate);
    }
  }

  const ordered = [...visible].sort((a, b) => a - b);
  const items: Array<number | "gap"> = [];
  let previous = 0;
  for (const value of ordered) {
    if (previous !== 0 && value - previous > 1) {
      items.push("gap");
    }
    items.push(value);
    previous = value;
  }
  return items;
}

const enabledClass =
  "inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-accent/50 hover:text-white";

const disabledClass =
  "inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/5 bg-slate-900/40 px-5 py-2.5 text-sm font-semibold text-slate-500 opacity-50";

const pageBaseClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-white/15 bg-slate-900 px-3 text-sm font-semibold text-slate-200 transition-colors hover:border-accent/50 hover:text-white";

const pageActiveClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-accent px-3 text-sm font-semibold text-slate-950";

export default function Pagination({
  page,
  totalPages,
  filters,
  basePath,
  ariaLabel = "Pagination",
}: {
  page: number;
  totalPages: number;
  filters: PaginationFilters;
  basePath: string;
  ariaLabel?: string;
}) {
  if (totalPages <= 1) return null;

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  const pageItems = buildPageItems(page, totalPages);

  return (
    <nav
      aria-label={ariaLabel}
      className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6"
    >
      <span className="sr-only" aria-live="polite">
        Page {page} of {totalPages}
      </span>

      {hasPrevious ? (
        <Link
          href={buildPageHref(basePath, filters, page - 1)}
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

      <ol className="flex flex-wrap items-center justify-center gap-2">
        {pageItems.map((item, index) =>
          item === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1 text-sm font-semibold text-slate-500"
            >
              &hellip;
            </li>
          ) : item === page ? (
            <li key={item}>
              <span aria-current="page" className={pageActiveClass}>
                {item}
              </span>
            </li>
          ) : (
            <li key={item}>
              <Link
                href={buildPageHref(basePath, filters, item)}
                aria-label={`Go to page ${item}`}
                className={pageBaseClass}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>

      {hasNext ? (
        <Link
          href={buildPageHref(basePath, filters, page + 1)}
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
