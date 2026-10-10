import type { ReactNode } from "react";
import type { CvDocument, CvPersonalInfo } from "@/lib/cv";
import { CV_FONTS, type CvFontId } from "@/lib/cvFonts";

type Props = {
  cv: CvDocument | null;
  personalInfo: CvPersonalInfo;
  font?: CvFontId;
  accentColor?: string;
  template?: string;
};

type SectionVariant = "professional" | "default";

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

/** A section is atomic during PDF pagination: never split one across pages. */
function Section({ children }: { children: ReactNode }) {
  return <section className="break-inside-avoid">{children}</section>;
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

type ContactEntry = { key: string; label: string; href?: string };

function toHref(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/**
 * Turns the profile fields into a contact list, giving URLs their mailto:/tel:/
 * https: prefix so the accent colour can be applied to real links in the CV.
 */
function buildContact(personalInfo: CvPersonalInfo): ContactEntry[] {
  const entries: ContactEntry[] = [];
  const add = (label: string | undefined, href?: string) => {
    const cleaned = label?.trim() ?? "";
    if (cleaned) {
      entries.push({ key: cleaned, label: cleaned, href });
    }
  };

  add(personalInfo.email, `mailto:${personalInfo.email}`);
  add(personalInfo.phone, `tel:${personalInfo.phone}`);
  add(personalInfo.location);
  add(personalInfo.website, toHref(personalInfo.website));
  add(personalInfo.linkedin, toHref(personalInfo.linkedin));
  add(personalInfo.github, toHref(personalInfo.github));

  return entries;
}

function ContactLine({
  entries,
  accent,
  inverse = false,
}: {
  entries: ContactEntry[];
  accent: string;
  inverse?: boolean;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <p className={`mt-1 text-xs ${inverse ? "text-white/90" : "text-slate-600"}`}>
      {entries.map((entry, index) => (
        <span key={`${entry.key}-${index}`}>
          {index > 0 && <span className="mx-1.5">·</span>}
          {entry.href ? (
            <a
              href={entry.href}
              className="underline-offset-2 hover:underline"
              style={inverse ? undefined : { color: accent }}
            >
              {entry.label}
            </a>
          ) : (
            entry.label
          )}
        </span>
      ))}
    </p>
  );
}

function SummaryBlock({
  cv,
  accent,
  variant,
}: {
  cv: CvDocument;
  accent: string;
  variant: SectionVariant;
}) {
  if (!cv.summary) {
    return null;
  }

  return (
    <Section>
      <SectionHeading accentColor={accent} variant={variant}>
        Professional Summary
      </SectionHeading>
      <p
        className="mt-2 text-xs leading-relaxed text-slate-700"
        contentEditable={true}
        suppressContentEditableWarning={true}
      >
        {cv.summary}
      </p>
    </Section>
  );
}

function SkillsBlock({
  cv,
  accent,
  variant,
  layout = "chips",
}: {
  cv: CvDocument;
  accent: string;
  variant: SectionVariant;
  layout?: "chips" | "list";
}) {
  if (cv.skills.length === 0) {
    return null;
  }

  return (
    <Section>
      <SectionHeading accentColor={accent} variant={variant}>
        Skills
      </SectionHeading>
      {layout === "list" ? (
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
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {cv.skills.map((skill, idx) => (
            <li
              key={`${skill}-${idx}`}
              className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
              contentEditable={true}
              suppressContentEditableWarning={true}
            >
              {skill}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function ExperienceBlock({
  cv,
  accent,
  variant,
}: {
  cv: CvDocument;
  accent: string;
  variant: SectionVariant;
}) {
  if (cv.experience.length === 0) {
    return null;
  }

  return (
    <Section>
      <SectionHeading accentColor={accent} variant={variant}>
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
    </Section>
  );
}

function EducationBlock({
  cv,
  accent,
  variant,
}: {
  cv: CvDocument;
  accent: string;
  variant: SectionVariant;
}) {
  if (!cv.education || cv.education.length === 0) {
    return null;
  }

  return (
    <Section>
      <SectionHeading accentColor={accent} variant={variant}>
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
    </Section>
  );
}

function CertificationsBlock({
  cv,
  accent,
  variant,
  layout = "rows",
}: {
  cv: CvDocument;
  accent: string;
  variant: SectionVariant;
  layout?: "rows" | "list";
}) {
  if (!cv.certifications || cv.certifications.length === 0) {
    return null;
  }

  return (
    <Section>
      <SectionHeading accentColor={accent} variant={variant}>
        Certifications
      </SectionHeading>
      {layout === "list" ? (
        <ul className="mt-2 space-y-0.5">
          {cv.certifications.map((entry, index) => (
            <li
              key={`${entry.name}-${index}`}
              className="text-[11px] text-slate-700"
              contentEditable={true}
              suppressContentEditableWarning={true}
            >
              • {entry.name}
            </li>
          ))}
        </ul>
      ) : (
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
      )}
    </Section>
  );
}

function LanguagesBlock({
  cv,
  accent,
  variant,
  layout = "inline",
}: {
  cv: CvDocument;
  accent: string;
  variant: SectionVariant;
  layout?: "inline" | "list";
}) {
  if (!cv.languages || cv.languages.length === 0) {
    return null;
  }

  const languageNames = (Array.isArray(cv.languages)
    ? cv.languages
    : [cv.languages]
  ).map((l) => (typeof l === "string" ? l : `${l.name} (${l.level})`));

  return (
    <Section>
      <SectionHeading accentColor={accent} variant={variant}>
        Languages
      </SectionHeading>
      {layout === "list" ? (
        <ul className="mt-2 space-y-0.5">
          {languageNames.map((language, idx) => (
            <li
              key={`${language}-${idx}`}
              className="text-[11px] text-slate-700"
              contentEditable={true}
              suppressContentEditableWarning={true}
            >
              • {language}
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="mt-2 text-xs text-slate-700"
          contentEditable={true}
          suppressContentEditableWarning={true}
        >
          {languageNames.join(", ")}
        </p>
      )}
    </Section>
  );
}

/**
 * Minimalist: clean single column. Section separation comes from an elegant
 * bottom border and whitespace rather than coloured bars, and the name is the
 * only place the accent is applied.
 */
function MinimalistTemplate({
  cv,
  personalInfo,
  accent,
  fontClassName,
  contact,
}: {
  cv: CvDocument;
  personalInfo: CvPersonalInfo;
  accent: string;
  fontClassName: string;
  contact: ContactEntry[];
}) {
  return (
    <div className={`cv-preview bg-white text-slate-800 ${fontClassName}`}>
      <header
        className="px-8 pt-8 pb-4"
        style={{ borderBottom: `2px solid ${accent}` }}
      >
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: accent }}>
          <span contentEditable={true} suppressContentEditableWarning={true}>
            {personalInfo.fullName || "Your Name"}
          </span>
        </h1>
        <ContactLine entries={contact} accent={accent} />
      </header>
      <div className="px-8 pb-8 pt-2">
        <SummaryBlock cv={cv} accent={accent} variant="default" />
        <SkillsBlock cv={cv} accent={accent} variant="default" />
        <ExperienceBlock cv={cv} accent={accent} variant="default" />
        <EducationBlock cv={cv} accent={accent} variant="default" />
        <CertificationsBlock cv={cv} accent={accent} variant="default" />
        <LanguagesBlock cv={cv} accent={accent} variant="default" />
      </div>
    </div>
  );
}

/**
 * Professional: single column with bold colour bars behind every section
 * heading and a double-rule under the name.
 */
function ProfessionalTemplate({
  cv,
  personalInfo,
  accent,
  fontClassName,
  contact,
}: {
  cv: CvDocument;
  personalInfo: CvPersonalInfo;
  accent: string;
  fontClassName: string;
  contact: ContactEntry[];
}) {
  return (
    <div className={`cv-preview bg-white text-slate-800 ${fontClassName}`}>
      <header
        className="px-8 pt-8 pb-4"
        style={{ borderBottom: `3px double ${accent}` }}
      >
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: accent }}>
          <span contentEditable={true} suppressContentEditableWarning={true}>
            {personalInfo.fullName || "Your Name"}
          </span>
        </h1>
        <ContactLine entries={contact} accent={accent} />
      </header>
      <div className="px-8 pb-8 pt-2">
        <SummaryBlock cv={cv} accent={accent} variant="professional" />
        <SkillsBlock cv={cv} accent={accent} variant="professional" />
        <ExperienceBlock cv={cv} accent={accent} variant="professional" />
        <EducationBlock cv={cv} accent={accent} variant="professional" />
        <CertificationsBlock cv={cv} accent={accent} variant="professional" />
        <LanguagesBlock cv={cv} accent={accent} variant="professional" />
      </div>
    </div>
  );
}

/**
 * Modern: two-column. Contact, Skills, Languages and Certifications live in a
 * narrow sidebar while the main column carries Summary, Experience and
 * Education, with a full-bleed accent header above both.
 */
function ModernTemplate({
  cv,
  personalInfo,
  accent,
  fontClassName,
  contact,
}: {
  cv: CvDocument;
  personalInfo: CvPersonalInfo;
  accent: string;
  fontClassName: string;
  contact: ContactEntry[];
}) {
  return (
    <div className={`cv-preview bg-white text-slate-800 ${fontClassName}`}>
      <header className="px-8 py-6" style={{ backgroundColor: accent }}>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          <span contentEditable={true} suppressContentEditableWarning={true}>
            {personalInfo.fullName || "Your Name"}
          </span>
        </h1>
        <ContactLine entries={contact} accent={accent} inverse />
      </header>
      <div className="grid gap-6 px-8 py-6 md:grid-cols-[1fr_2fr]">
        <aside className="space-y-1">
          <SkillsBlock cv={cv} accent={accent} variant="default" layout="list" />
          <LanguagesBlock cv={cv} accent={accent} variant="default" layout="list" />
          <CertificationsBlock
            cv={cv}
            accent={accent}
            variant="default"
            layout="list"
          />
        </aside>
        <main>
          <SummaryBlock cv={cv} accent={accent} variant="default" />
          <ExperienceBlock cv={cv} accent={accent} variant="default" />
          <EducationBlock cv={cv} accent={accent} variant="default" />
        </main>
      </div>
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

  const fontClassName =
    CV_FONTS[font ?? "inter"]?.className ?? CV_FONTS.inter.className;
  const accent = accentColor || "#0f172a";
  const contact = buildContact(personalInfo);

  if (template === "modern") {
    return (
      <ModernTemplate
        cv={cv}
        personalInfo={personalInfo}
        accent={accent}
        fontClassName={fontClassName}
        contact={contact}
      />
    );
  }

  if (template === "professional") {
    return (
      <ProfessionalTemplate
        cv={cv}
        personalInfo={personalInfo}
        accent={accent}
        fontClassName={fontClassName}
        contact={contact}
      />
    );
  }

  return (
    <MinimalistTemplate
      cv={cv}
      personalInfo={personalInfo}
      accent={accent}
      fontClassName={fontClassName}
      contact={contact}
    />
  );
}

export default CvPreview;