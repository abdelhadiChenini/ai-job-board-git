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

  const tagClass =
    "rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300";

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-slate-200 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-800/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-slate-950 text-sm font-bold text-slate-300">
            {companyInitials(labName)}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {labName}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          ★ New
        </span>
      </header>

      <h3 className="text-lg font-semibold leading-snug text-slate-100">
        {title}
      </h3>

      <p className="text-sm text-slate-400">{location}</p>

      <div className="flex flex-wrap items-center gap-2">
        {visibleTags.length > 0 ? (
          <>
            {visibleTags.map((tag) => (
              <span key={tag} className={tagClass}>
                {tag}
              </span>
            ))}
            {extraCount > 0 && (
              <span className={tagClass}>+{extraCount}</span>
            )}
          </>
        ) : (
          <span className={tagClass}>AI Training</span>
        )}
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto text-sm font-medium text-blue-400 transition-colors hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
      >
        View opportunity →
      </a>
    </article>
  );
}

export default JobCard;