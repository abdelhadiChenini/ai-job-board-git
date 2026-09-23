import type { ReactNode } from "react";

type PlatformCardProps = {
  name: string;
  description: string | null;
  tags: string[];
  websiteUrl: string | null;
  featured?: boolean;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function Tags({ tags }: { tags: string[] }): ReactNode {
  if (tags.length === 0) {
    return null;
  }
  return (
    <ul className="mt-3 mb-4 flex flex-wrap gap-2" aria-label="Skill tags">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}

export function PlatformCard({
  name,
  description,
  tags,
  websiteUrl,
  featured = false,
}: PlatformCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500">
            {initials(name)}
          </div>
          <h3 className="truncate text-lg font-semibold leading-snug text-slate-900">
            {name}
          </h3>
        </div>

        {featured ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              aria-hidden="true"
            />
            Featured
          </span>
        ) : (
          <span
            className="shrink-0 pt-1 text-slate-400"
            aria-hidden="true"
          >
            ↗
          </span>
        )}
      </header>

      {description && (
        <p className="mt-3 mb-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      )}

      <Tags tags={tags} />

      <a
        href={websiteUrl ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100/70 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Explore Platform →
      </a>
    </article>
  );
}

export default PlatformCard;