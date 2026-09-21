import type { ReactNode } from "react";

type JobCardProps = {
  title: string;
  labName: string;
  tags: string[];
  url: string;
};

function Tags({ tags }: { tags: string[] }): ReactNode {
  if (tags.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Tags">
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

export function JobCard({ title, labName, tags, url }: JobCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-card bg-paper p-6 text-slate-900 shadow-md shadow-black/10">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          {labName}
        </p>
        <h3 className="text-lg font-semibold leading-snug text-slate-900">
          {title}
        </h3>
      </header>

      <Tags tags={tags} />

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700"
      >
        Apply Now
      </a>
    </article>
  );
}

export default JobCard;