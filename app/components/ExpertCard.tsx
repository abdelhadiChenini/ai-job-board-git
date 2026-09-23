import type { ReactNode } from "react";

type ExpertCardProps = {
  name: string;
  title: string | null;
  skills: string[];
  profileUrl: string;
  imageUrl?: string | null;
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
          className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300"
        >
          {skill}
        </li>
      ))}
      {extra > 0 && (
        <li className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300">
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
  imageUrl,
  maxSkills = 3,
}: ExpertCardProps) {
  const isMailLink = profileUrl.startsWith("mailto:");

  return (
    <article className="flex flex-col items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-200 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-800/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      {typeof imageUrl === "string" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-500/40"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-2xl font-bold text-white">
          {profileInitials(name) || "AI"}
        </div>
      )}

      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold leading-snug text-slate-100">
          {name}
        </h3>
        {title && (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
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