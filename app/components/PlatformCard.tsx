import type { ReactNode } from "react";

type PlatformCardProps = {
  name: string;
  description: string | null;
  tags: string[];
  websiteUrl: string | null;
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
    <ul className="flex flex-wrap gap-2" aria-label="Skill tags">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
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
}: PlatformCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60">
      <header className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-lg font-bold text-blue-700">
          {initials(name)}
        </div>
        <h3 className="truncate text-lg font-semibold leading-snug text-slate-900">
          {name}
        </h3>
      </header>

      {description && (
        <p className="text-sm leading-relaxed text-slate-600">{description}</p>
      )}

      <Tags tags={tags} />

      <a
        href={websiteUrl ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700"
      >
        Explore Platform
      </a>
    </article>
  );
}

export default PlatformCard;