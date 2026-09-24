import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Globe } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

function LinkedinIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={props.className}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

function TwitterIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={props.className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GithubIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={props.className}
      aria-hidden="true"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const getExpert = cache(async (id: string) => {
  const byId = await prisma.expertProfile.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  return (
    byId ??
    (await prisma.expertProfile.findUnique({
      where: { userId: id },
      include: { user: { select: { email: true } } },
    }))
  );
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const profile = await getExpert(params.id);
  if (!profile) {
    return { title: "Expert Profile" };
  }
  return {
    title: profile.fullName,
    description: profile.headline || profile.bio?.slice(0, 160) || undefined,
  };
}

export const dynamic = "force-dynamic";

export default async function ExpertProfilePage({ params }: Params) {
  const session = await getServerSession(authOptions);
  const profile = await getExpert(params.id);

  if (!profile) {
    notFound();
  }

  const viewerId = session?.user?.id;
  const isOwner = viewerId === profile.userId;
  const isAdmin = session?.user?.role === "ADMIN";
  const canView = profile.isPublic || isOwner || isAdmin;

  if (!canView) {
    notFound();
  }

  const skills = Array.isArray(profile.skills)
    ? profile.skills.map((skill) => String(skill))
    : [];
  const expertise =
    profile.areasOfExpertise
      ?.split(/[,]+/)
      .map((item) => item.trim())
      .filter(Boolean) ?? [];

  const location = [profile.country, profile.stateRegion]
    .filter(Boolean)
    .join(", ");

  const showEmail = Boolean(profile.showEmail || isOwner || isAdmin);
  const showPhone = Boolean(profile.showPhone || isOwner || isAdmin);
  const available = profile.availability === "Available for Work";

  const firstName = profile.fullName.split(/\s+/)[0] ?? profile.fullName;
  const initials = profile.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const socialLinks = [
    { label: "LinkedIn", url: profile.linkedin },
    { label: "X", url: profile.xUrl },
    { label: "GitHub", url: profile.github },
    { label: "YouTube", url: profile.youtube },
    { label: "Website", url: profile.website },
  ].filter((link): link is { label: string; url: string } => Boolean(link.url));

  const workPreferences = [
    { label: "Years of experience", value: profile.yearsOfExperience },
    { label: "Work preference", value: profile.workPreference },
  ].filter((row) => row.value);

  const contactHref =
    showEmail && profile.user.email
      ? `mailto:${profile.user.email}`
      : socialLinks.find((link) => link.label === "Website")?.url ??
        socialLinks.find((link) => link.label === "LinkedIn")?.url ??
        null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/25 via-slate-900 to-emerald-500/15 p-6 sm:p-10">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(500px 300px at 90% -10%, rgba(56,189,248,0.14), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {profile.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profilePicture}
              alt={profile.fullName}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-accent/40"
            />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent to-emerald-400 text-2xl font-bold text-slate-950">
              {initials || "AI"}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              AI Expert
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {profile.fullName}
            </h1>
            {profile.headline && (
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-accent">
                {profile.headline}
              </p>
            )}
            {location && (
              <p className="mt-2 text-sm text-slate-300">{location}</p>
            )}
          </div>

          {isOwner && (
            <Link
              href="/dashboard/edit"
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-accent/80"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-2">
          {profile.bio && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                About
              </h2>
              <div className="prose prose-invert prose-sm mt-4 max-w-none whitespace-pre-line leading-relaxed text-slate-300">
                {profile.bio}
              </div>
            </section>
          )}

          {(skills.length > 0 || expertise.length > 0) && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Expertise
              </h2>
              {expertise.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Areas of expertise
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {expertise.map((area) => (
                      <span
                        key={area}
                        className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skills.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-blue-600/15 px-3 py-1 text-xs font-semibold text-blue-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {(profile.languages || profile.education || profile.certifications) && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Qualifications
              </h2>
              <div className="mt-4 flex flex-col gap-5">
                {profile.languages && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Languages
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      {profile.languages}
                    </p>
                  </div>
                )}
                {profile.education && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Education
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-200">
                      {profile.education}
                    </p>
                  </div>
                )}
                {profile.certifications && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Certifications
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-200">
                      {profile.certifications}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-8">
          <div className="sticky top-24 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Hourly rate
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {profile.hourlyRate || "On request"}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  available
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-slate-500/15 text-slate-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    available ? "animate-pulse bg-emerald-400" : "bg-slate-400"
                  }`}
                  aria-hidden="true"
                />
                {available ? "Available for Work" : "Not Looking"}
              </span>
            </div>

            <div className="mt-6 border-t border-slate-800 pt-5">
              {contactHref ? (
                <a
                  href={contactHref}
                  className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Contact {firstName}
                </a>
              ) : (
                <p className="rounded-full border border-slate-800 px-6 py-3 text-center text-sm font-semibold text-slate-500">
                  Contact details hidden
                </p>
              )}
            </div>
          </div>

          {workPreferences.length > 0 && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Work Preferences
              </h2>
              <dl className="mt-4 flex flex-col gap-4">
                {workPreferences.map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {row.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-200">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {socialLinks.length > 0 && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Social Links
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3.5 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-accent/60 hover:text-white"
                  >
                    {link.label}
                    <span className="text-slate-500">↗</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {(showEmail || showPhone) && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Contact
              </h2>
              <div className="mt-4 flex flex-col gap-2">
                {showEmail && profile.user.email && (
                  <a
                    href={`mailto:${profile.user.email}`}
                    className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-accent/80"
                  >
                    Email {firstName}
                  </a>
                )}
                {showPhone && profile.phoneNumber && (
                  <a
                    href={`tel:${profile.phoneNumber.replace(/[^+\d]/g, "")}`}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-accent/60 hover:text-white"
                  >
                    Call {firstName}
                  </a>
                )}
              </div>

              <div className="mt-6 flex items-center justify-center gap-5 border-t border-slate-800/50 pt-6">
                {profile.linkedInUrl && (
                  <a
                    href={profile.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 transition-colors hover:text-blue-500"
                  >
                    <LinkedinIcon className="h-5 w-5" />
                  </a>
                )}
                {profile.twitterUrl && (
                  <a
                    href={profile.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 transition-colors hover:text-blue-400"
                  >
                    <TwitterIcon className="h-5 w-5" />
                  </a>
                )}
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 transition-colors hover:text-slate-200"
                  >
                    <GithubIcon className="h-5 w-5" />
                  </a>
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 transition-colors hover:text-indigo-400"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}