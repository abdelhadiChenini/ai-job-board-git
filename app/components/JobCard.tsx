type JobCardProps = {
  title: string;
  labName: string;
  tags: string[];
  url: string;
  location?: string;
};

function companyInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function JobCard({
  title,
  labName,
  tags,
  url,
  location = "💻 Remote 📍 Global",
}: JobCardProps) {
  const primaryTag = tags[0] ?? "AI Training";

  return (
    <article className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
            {companyInitials(labName)}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {labName}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          ★ New
        </span>
      </header>

      <h3 className="text-lg font-bold leading-snug text-slate-900">
        {title}
      </h3>

      <p className="text-sm text-slate-500">{location}</p>

      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
        🏷️ {primaryTag}
      </span>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto text-sm font-semibold text-blue-600 transition-colors hover:text-blue-500 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        View opportunity →
      </a>
    </article>
  );
}

export default JobCard;