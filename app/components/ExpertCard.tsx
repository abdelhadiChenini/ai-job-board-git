import type { ReactNode } from "react";

type ExpertCardProps = {
  name: string;
  title: string | null;
  bio: string | null;
  skills: string[];
  email: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
};

function Skills({ skills }: { skills: string[] }): ReactNode {
  if (skills.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Skills">
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

export function ExpertCard({
  name,
  title,
  bio,
  skills,
  email,
  twitterUrl,
  linkedinUrl,
}: ExpertCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-card bg-paper p-6 text-slate-900 shadow-md shadow-black/10">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-lg font-semibold leading-snug text-slate-900">
            {name}
          </h3>
          {title && (
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {title}
            </p>
          )}
        </div>
      </header>

      {bio && <p className="text-sm leading-relaxed text-slate-600">{bio}</p>}

      <Skills skills={skills} />

      <div className="mt-auto flex flex-wrap gap-2">
        {email && (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700"
          >
            Contact
          </a>
        )}
        {twitterUrl && (
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Twitter
          </a>
        )}
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            LinkedIn
          </a>
        )}
      </div>
    </article>
  );
}

export default ExpertCard;