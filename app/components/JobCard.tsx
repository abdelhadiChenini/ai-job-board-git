type JobCardProps = {
  title: string;
  labName: string;
  tags: string[];
  url: string;
  location?: string;
  maxTags?: number;
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
  maxTags = 3,
}: JobCardProps) {
  const visibleTags = tags.slice(0, maxTags);
  const extraCount = tags.length - visibleTags.length;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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

      <div className="flex flex-wrap items-center gap-2">
        {visibleTags.length > 0 ? (
          <>
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800"
              >
                {tag}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
                +{extraCount}
              </span>
            )}
          </>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
            AI Training
          </span>
        )}
      </div>

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