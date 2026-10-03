import type { CvDocument, CvPersonalInfo } from "@/lib/cv";

/**
 * The printable CV.
 */

type Props = {
  cv: CvDocument | null;
  personalInfo: CvPersonalInfo;
  font?: string;
  accentColor?: string;
};

function SectionHeading({ children, accentColor }: { children: string; accentColor?: string }) {
  return (
    <h2
      className="mt-6 border-b pb-1 text-xs font-bold uppercase tracking-widest"
      style={{ borderColor: accentColor || "#cbd5e1", color: accentColor || "#475569" }}
    >
      {children}
    </h2>
  );
}

function EmptyPreview() {
  return (
    <div className="flex h-full min-h-[600px] flex-col items-center justify-center gap-2 p-10 text-center">
      <p className="text-sm font-semibold text-slate-500">No CV yet</p>
      <p className="max-w-xs text-xs text-slate-400">
        Fill in your details and raw experience on the left, then generate your CV
        tailored to a specific role. It will appear here, ready to download.
      </p>
    </div>
  );
}

export function CvPreview({ cv, personalInfo }: Props) {
  if (!cv) {
    return <EmptyPreview />;
  }

  const contact = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.website,
    personalInfo.linkedin,
    personalInfo.github,
  ].filter((value): value is string => Boolean(value && value.trim()));

  return (
    <div className="min-h-[600px] bg-white p-8 text-slate-800">
      <header className="border-b-2 border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {personalInfo.fullName || "Your Name"}
        </h1>
        {contact.length > 0 && (
          <p className="mt-1 text-xs text-slate-600">{contact.join("  ·  ")}</p>
        )}
      </header>

      {cv.summary && (
        <section>
          <SectionHeading>Professional Summary</SectionHeading>
          <p className="mt-2 text-xs leading-relaxed text-slate-700">
            {cv.summary}
          </p>
        </section>
      )}

      {cv.skills.length > 0 && (
        <section>
          <SectionHeading>Skills</SectionHeading>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {cv.skills.map((skill) => (
              <li
                key={skill}
                className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
              >
                {skill}
              </li>
            ))}
          </ul>
        </section>
      )}

      {cv.experience.length > 0 && (
        <section>
          <SectionHeading>Experience</SectionHeading>
          <div className="mt-2 space-y-4">
            {cv.experience.map((entry, index) => (
              <div key={`${entry.company}-${entry.title}-${index}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold text-slate-900">
                    {entry.title || "Role"}
                    {entry.company && (
                      <span className="font-normal text-slate-600">
                        {" "}
                        — {entry.company}
                      </span>
                    )}
                  </p>
                  {entry.duration && (
                    <p className="shrink-0 text-[11px] italic text-slate-500">
                      {entry.duration}
                    </p>
                  )}
                </div>

                {entry.achievements.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {entry.achievements.map((achievement, aIndex) => (
                      <li
                        key={`${achievement}-${aIndex}`}
                        className="flex gap-2 text-xs leading-relaxed text-slate-700"
                      >
                        <span aria-hidden="true" className="text-slate-400">
                          •
                        </span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {cv.education && cv.education.length > 0 && (
        <section>
          <SectionHeading accentColor={accent}>Education</SectionHeading>
          <div className="mt-2 space-y-2">
            {cv.education.map((entry, index) => (
              <div
                key={`${entry.institution}-${entry.degree}-${index}`}
                className="flex items-baseline justify-between gap-3"
              >
                <p className="text-xs text-slate-700">
                  <span
                    className="font-semibold text-slate-900"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                  >
                    {entry.degree || "Degree"}
                  </span>
                  {entry.institution && (
                    <span contentEditable={true} suppressContentEditableWarning={true}>
                      {" "}
                      — {entry.institution}
                    </span>
                  )}
                </p>
                {entry.year && (
                  <p
                    className="shrink-0 text-[11px] italic text-slate-500"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                  >
                    {entry.year}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {cv.languages && cv.languages.length > 0 && (
        <section>
          <SectionHeading accentColor={accent}>Languages</SectionHeading>
          <p
            className="mt-2 text-xs text-slate-700"
            contentEditable={true}
            suppressContentEditableWarning={true}
          >
            {Array.isArray(cv.languages) ? cv.languages.join(", ") : cv.languages}
          </p>
        </section>
      )}
    </div>
  );
}

export default CvPreview;