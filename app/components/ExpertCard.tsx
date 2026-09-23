import type { ReactNode } from "react";

type ExpertCardProps = {
  name: string;
  title: string | null;
  skills: string[];
  profileUrl: string;
  maxSkills?: number;
};

function profileInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function Skills({ skills, maxSkills }: { skills: string[]; maxSkills: number }): ReactNode {
  if (skills.length === 0) {
    return null;
  }
  const visible = skills.slice(0, maxSkills);
  const extra = skills.length - visible.length;
  return (
    <ul
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label="Professional skills"
    >
      {visible.map((skill) => (
        <li
          key={skill}
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800"
        >
          {skill}
        </li>
      ))}
      {extra > 0 && (
        <li className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
          +{extra}
        </li>
      )}
    </ul>
  );
}

export function ExpertCard({
  name,
  title,
  skills,
  profileUrl,
  maxSkills = 3,
}: ExpertCardProps) {
  const isMailLink = profileUrl.startsWith("mailto:");

  return (
    <article className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-2xl font-bold text-white">
        {profileInitials(name) || "AI"}
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

      <Skills skills={skills} maxSkills={maxSkills} />

      <a
        href={profileUrl}
        {...(!isMailLink
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        View Expert Profile
      </a>
    </article>
  );
}

export default ExpertCard;