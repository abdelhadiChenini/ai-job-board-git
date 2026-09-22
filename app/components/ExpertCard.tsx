import type { ReactNode } from "react";

type ExpertCardProps = {
  name: string;
  title: string | null;
  skills: string[];
  profileUrl: string;
};

function Skills({ skills }: { skills: string[] }): ReactNode {
  if (skills.length === 0) {
    return null;
  }
  return (
    <ul
      className="flex flex-wrap gap-2"
      aria-label="Professional skills"
    >
      {skills.map((skill) => (
        <li
          key={skill}
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
        >
          {skill}
        </li>
      ))}
    </ul>
  );
}

export function ExpertCard({ name, title, skills, profileUrl }: ExpertCardProps) {
  const isMailLink = profileUrl.startsWith("mailto:");

  return (
    <article className="flex flex-col items-center gap-4 rounded-card border border-slate-200 bg-white p-6 text-center shadow-md shadow-slate-200/60">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
        {name.split(" ")[0]?.charAt(0).toUpperCase()}
        {name.split(" ")[1]?.charAt(0).toUpperCase()}
      </div>

      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold leading-snug text-slate-900">
          {name}
        </h3>
        {title && (
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {title}
          </p>
        )}
      </header>

      <Skills skills={skills} />

      <a
        href={profileUrl}
        {...(!isMailLink
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className="mt-auto inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700"
      >
        View Expert Profile
      </a>
    </article>
  );
}

export default ExpertCard;