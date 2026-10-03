import type { CvDocument, CvPersonalInfo } from "@/lib/cv";

type Props = {
  cv: CvDocument | null;
  personalInfo: CvPersonalInfo;
  font?: string;
  accentColor?: string;
  template?: string;
};

function SectionHeading({
  children,
  accentColor,
  variant,
}: {
  children: string;
  accentColor?: string;
  variant?: string;
}) {
  if (variant === "professional") {
    return (
      <h2
        className="mt-6 rounded-sm px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
        style={{ backgroundColor: accentColor || "#334155" }}
      >
        {children}
      </h2>
    );
  }

  return (
    <h2
      className="mt-6 border-b pb-1 text-xs font-bold uppercase tracking-widest"
      style={{
        borderColor: accentColor || "#cbd5e1",
        color: accentColor || "#475569",
      }}
    >
      {children}
    </h2>
  );
}

function EmptyPreview() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
      <p className="text-sm font-semibold text-slate-500">No CV yet</p>
      <p className="max-w-xs text-xs text-slate-400">
        Fill in your details and raw experience on the left, then generate your CV
        tailored to a specific role. It will appear here, ready to download.
      </p>
    </div>
  );
}

export function CvPreview({
  cv,
  personalInfo,
  font,
  accentColor,
  template = "minimalist",
}: Props) {
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

  const fontClass = font === "serif" ? "font-serif" : "font-sans";
  const accent = accentColor || "#0f172a";
  const headingVariant = template === "professional" ? "professional" : "default";

  const mainSections = (
    <>
      {cv.summary && (
        <section className="break-inside-avoid">
          <SectionHeading accentColor={accent} variant={headingVariant}>
            Professional Summary
          </SectionHeading>
          <p
            className="mt-2 text-xs leading-relaxed text-slate-700"
            contentEditable={true}
            suppressContentEditableWarning={true}
          >
            {cv.summary}
          </p>
        </section>
      )}

      {cv.skills.length > 0 && (
        <section className="break-inside-avoid">
          <SectionHeading accentColor={accent} variant={headingVariant}>
            Skills
          </SectionHeading>
          <ul
            className="mt-2 flex flex-wrap gap-1.5"
            contentEditable={true}
            suppressContentEditableWarning={true}
          >
            {cv.skills.map((skill, idx) => (
              <li
                key={`${skill}-${idx}`}
                className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
              >
                {skill}
              </li>
            ))}
          </ul>
        </section>
      )}

      {cv.experience.length > 0 && (
        <section className="break-inside-avoid">
          <SectionHeading accentColor={accent} variant={headingVariant}>
            Experience
          </SectionHeading>
          <div className="mt-2 space-y-4">
            {cv.experience.map((entry, index) => (
              <div
                key={`${entry.company}-${entry.title}-${index}`}
                className="break-inside-avoid"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold text-slate-900">
                    <span contentEditable={true} suppressContentEditableWarning={true}>
                      {entry.title || "Role"}
                    </span>
                    {entry.company && (
                      <span className="font-normal text-slate-600">
                        {" "}
                        —{" "}
                        <span contentEditable={true} suppressContentEditableWarning={true}>
                          {entry.company}
                        </span>
                      </span>
                    )}
                  </p>
                  {entry.duration && (
                    <p
                      className="shrink-0 text-[11px] italic text-slate-500"
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                    >
                      {entry.duration}
                    </p>
                  )}
                </div>

                {entry.achievements.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {entry.achievements.map((achievement, aIndex) => (
                      <li
                        key={`${achievement}-${aIndex}`}
                        className="flex gap-2 text-[11px] leading-relaxed text-slate-700"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
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
        <section className="break-inside-avoid">
          <SectionHeading accentColor={accent} variant={headingVariant}>
            Education
          </SectionHeading>
          <div className="mt-2 space-y-2">
            {cv.education.map((entry, index) => (
              <div
                key={`${entry.institution}-${entry.degree}-${index}`}
                className="break-inside-avoid"
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
                    className="text-[11px] italic text-slate-500"
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

      {cv.certifications && cv.certifications.length > 0 && (
        <section className="break-inside-avoid">
          <SectionHeading accentColor={accent} variant={headingVariant}>
            Certifications
          </SectionHeading>
          <div className="mt-2 space-y-1">
            {cv.certifications.map((entry, index) => (
              <div
                key={`${entry.name}-${index}`}
                className="flex items-baseline justify-between gap-3 text-xs break-inside-avoid"
              >
                <p className="text-slate-700">
                  <span
                    className="font-semibold text-slate-900"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                  >
                    {entry.name}
                  </span>
                  {entry.issuer && (
                    <span contentEditable={true} suppressContentEditableWarning={true}>
                      {" "}
                      — {entry.issuer}
                    </span>
                  )}
                </p>
                {entry.year && (
                  <p
                    className="shrink-0 italic text-slate-500"
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
        <section className="break-inside-avoid">
          <SectionHeading accentColor={accent} variant={headingVariant}>
            Languages
          </SectionHeading>
          <p
            className="mt-2 text-xs text-slate-700"
            contentEditable={true}
            suppressContentEditableWarning={true}
          >
            {Array.isArray(cv.languages)
              ? cv.languages
                  .map((l) => (typeof l === "string" ? l : `${l.name} (${l.level})`))
                  .join(", ")
              : cv.languages}
          </p>
        </section>
      )}
    </>
  );

  if (template === "modern") {
    return (
      <div className={`bg-white text-slate-800 ${fontClass}`}>
        <header className="px-8 py-6" style={{ backgroundColor: accent }}>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            <span contentEditable={true} suppressContentEditableWarning={true}>
              {personalInfo.fullName || "Your Name"}
            </span>
          </h1>
          {contact.length > 0 && (
            <p
              className="mt-1 text-xs text-white/90"
              contentEditable={true}
              suppressContentEditableWarning={true}
            >
              {contact.join("  ·  ")}
            </p>
          )}
        </header>
        <div className="grid gap-6 px-8 py-6 md:grid-cols-[1fr_2fr]">
          <aside className="space-y-1">
            {cv.skills.length > 0 && (
              <section className="break-inside-avoid">
                <SectionHeading accentColor={accent} variant={headingVariant}>
                  Skills
                </SectionHeading>
                <ul className="mt-2 space-y-0.5">
                  {cv.skills.map((skill, idx) => (
                    <li
                      key={`${skill}-${idx}`}
                      className="text-[11px] text-slate-700"
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                    >
                      • {skill}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {cv.languages && cv.languages.length > 0 && (
              <section className="break-inside-avoid">
                <SectionHeading accentColor={accent} variant={headingVariant}>
                  Languages
                </SectionHeading>
                <ul className="mt-2 space-y-0.5">
                  {(Array.isArray(cv.languages)
                    ? cv.languages
                    : [cv.languages]
                  ).map((l, idx) => (
                    <li
                      key={idx}
                      className="text-[11px] text-slate-700"
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                    >
                      • {typeof l === "string" ? l : `${l.name} (${l.level})`}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {cv.certifications && cv.certifications.length > 0 && (
              <section className="break-inside-avoid">
                <SectionHeading accentColor={accent} variant={headingVariant}>
                  Certifications
                </SectionHeading>
                <ul className="mt-2 space-y-0.5">
                  {cv.certifications.map((entry, idx) => (
                    <li
                      key={`${entry.name}-${idx}`}
                      className="text-[11px] text-slate-700"
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                    >
                      • {entry.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>

          <main>
            {cv.summary && (
              <section className="break-inside-avoid">
                <SectionHeading accentColor={accent} variant={headingVariant}>
                  Professional Summary
                </SectionHeading>
                <p
                  className="mt-2 text-xs leading-relaxed text-slate-700"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                >
                  {cv.summary}
                </p>
              </section>
            )}

            {cv.experience.length > 0 && (
              <section className="break-inside-avoid">
                <SectionHeading accentColor={accent} variant={headingVariant}>
                  Experience
                </SectionHeading>
                <div className="mt-2 space-y-4">
                  {cv.experience.map((entry, index) => (
                    <div
                      key={`${entry.company}-${entry.title}-${index}`}
                      className="break-inside-avoid"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-bold text-slate-900">
                          <span
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                          >
                            {entry.title || "Role"}
                          </span>
                          {entry.company && (
                            <span className="font-normal text-slate-600">
                              {" "}
                              —{" "}
                              <span
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                              >
                                {entry.company}
                              </span>
                            </span>
                          )}
                        </p>
                        {entry.duration && (
                          <p
                            className="shrink-0 text-[11px] italic text-slate-500"
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                          >
                            {entry.duration}
                          </p>
                        )}
                      </div>
                      {entry.achievements.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {entry.achievements.map((achievement, aIndex) => (
                            <li
                              key={`${achievement}-${aIndex}`}
                              className="flex gap-2 text-[11px] leading-relaxed text-slate-700"
                              contentEditable={true}
                              suppressContentEditableWarning={true}
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
              <section className="break-inside-avoid">
                <SectionHeading accentColor={accent} variant={headingVariant}>
                  Education
                </SectionHeading>
                <div className="mt-2 space-y-2">
                  {cv.education.map((entry, index) => (
                    <div
                      key={`${entry.institution}-${entry.degree}-${index}`}
                      className="break-inside-avoid"
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
                          <span
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                          >
                            {" "}
                            — {entry.institution}
                          </span>
                        )}
                      </p>
                      {entry.year && (
                        <p
                          className="text-[11px] italic text-slate-500"
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
          </main>
        </div>
      </div>
    );
  }

  const headerClass = template === "professional" ? "px-8 pt-8 pb-4" : "px-8 pt-8 pb-4";
  const headerStyle =
    template === "professional"
      ? { borderBottom: `3px double ${accent}` }
      : { borderBottom: `2px solid ${accent}` };

  return (
    <div className={`bg-white text-slate-800 ${fontClass}`}>
      <header className={headerClass} style={headerStyle}>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: accent }}
        >
          <span contentEditable={true} suppressContentEditableWarning={true}>
            {personalInfo.fullName || "Your Name"}
          </span>
        </h1>
        {contact.length > 0 && (
          <p
            className="mt-1 text-xs text-slate-600"
            contentEditable={true}
            suppressContentEditableWarning={true}
          >
            {contact.join("  ·  ")}
          </p>
        )}
      </header>
      <div className={template === "minimalist" ? "px-8 pb-8 pt-2" : "px-8 pb-8 pt-2"}>
        {mainSections}
      </div>
    </div>
  );
}

export default CvPreview;
