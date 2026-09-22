import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

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
    { label: "Availability", value: profile.availability },
    { label: "Work preference", value: profile.workPreference },
    { label: "Hourly rate", value: profile.hourlyRate },
  ].filter((row) => row.value);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-10">
      <section className="rounded-card border border-white/10 bg-slate-800 p-6 sm:p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {profile.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profilePicture}
              alt={profile.fullName}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-blue-500/40"
            />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
              {initials || "AI"}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="inline-block rounded-full bg-blue-600/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-400">
              AI Expert
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
              {profile.fullName}
            </h1>
            {profile.headline && (
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
                {profile.headline}
              </p>
            )}
            {location && (
              <p className="mt-2 text-sm text-slate-400">{location}</p>
            )}
          </div>

          {isOwner && (
            <Link
              href="/dashboard/edit"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-2">
          {profile.bio && (
            <section className="rounded-card border border-white/10 bg-slate-800 p-6 sm:p-8">
              <h2 className="text-lg font-bold tracking-tight text-white">
                About
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {profile.bio}
              </p>
            </section>
          )}

          {(skills.length > 0 || expertise.length > 0) && (
            <section className="rounded-card border border-white/10 bg-slate-800 p-6 sm:p-8">
              <h2 className="text-lg font-bold tracking-tight text-white">
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
                        className="rounded-lg bg-white/5 px-2.5 py-1 text-sm text-slate-300"
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
                        className="rounded-full bg-blue-600/15 px-2.5 py-1 text-xs font-semibold text-blue-400"
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
            <section className="rounded-card border border-white/10 bg-slate-800 p-6 sm:p-8">
              <h2 className="text-lg font-bold tracking-tight text-white">
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

        <aside className="flex flex-col gap-8">
          {workPreferences.length > 0 && (
            <section className="rounded-card border border-white/10 bg-slate-800 p-6">
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
            <section className="rounded-card border border-white/10 bg-slate-800 p-6">
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
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3.5 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-blue-500/50 hover:text-white"
                  >
                    {link.label}
                    <span className="text-slate-500">↗</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {(showEmail || showPhone) && (
            <section className="rounded-card border border-white/10 bg-slate-800 p-6">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Contact
              </h2>
              <div className="mt-4 flex flex-col gap-2">
                {showEmail && profile.user.email && (
                  <a
                    href={`mailto:${profile.user.email}`}
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                  >
                    Email {firstName}
                  </a>
                )}
                {showPhone && profile.phoneNumber && (
                  <a
                    href={`tel:${profile.phoneNumber.replace(/[^+\d]/g, "")}`}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-blue-500/50 hover:text-white"
                  >
                    Call {firstName}
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