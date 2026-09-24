import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCompleteness } from "@/lib/completeness";
import DashboardSidebar from "./DashboardSidebar";
import ProfileAvailability from "./ProfileAvailability";
import RecommendedForYou from "./RecommendedForYou";
import Activity from "./Activity";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  let profile: Awaited<
    ReturnType<typeof prisma.expertProfile.findUnique>
  > | null = null;

  if (session.user.id) {
    try {
      profile = await prisma.expertProfile.findUnique({
        where: { userId: session.user.id },
      });
    } catch (error) {
      console.error("Failed to load expert profile:", error);
      profile = {
        id: "",
        fullName: session.user.email ?? "Expert",
        profilePicture: null,
        headline: null,
        country: null,
        skills: [],
        savedJobs: [],
        appliedJobs: [],
        isPublic: false,
        verificationStatus: "PENDING",
        bio: null,
        stateRegion: null,
        areasOfExpertise: null,
        languages: null,
        yearsOfExperience: null,
        availability: null,
        workPreference: null,
        hourlyRate: null,
        education: null,
        certifications: null,
        linkedin: null,
        xUrl: null,
        github: null,
        youtube: null,
        website: null,
        phoneNumber: null,
        showEmail: false,
        showPhone: false,
        emailUpdates: true,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  const fullName = profile?.fullName ?? session.user.email ?? "Expert";
  const headline = profile?.headline ?? "";
  const country = profile?.country ?? "";
  const skills = Array.isArray(profile?.skills)
    ? (profile.skills as string[])
    : [];
  const photo = profile?.profilePicture ?? null;

  const completeness = calculateCompleteness(profile);

  const verified = profile?.verificationStatus === "VERIFIED";
  const publicProfileUrl = profile ? `/experts/${profile.id}` : null;

  const savedJobIds = Array.isArray(profile?.savedJobs)
    ? (profile.savedJobs as string[])
    : [];
  const appliedJobIds = Array.isArray(profile?.appliedJobs)
    ? (profile.appliedJobs as string[])
    : [];

  const activitySelect = {
    id: true,
    slug: true,
    title: true,
    aiLabName: true,
    affiliateUrl: true,
    platform: {
      select: { name: true, logoUrl: true },
    },
  } as const;

  const savedJobs =
    savedJobIds.length > 0
      ? await prisma.jobOffer.findMany({
          where: { id: { in: savedJobIds } },
          select: activitySelect,
          orderBy: { createdAt: "desc" },
        })
      : [];

  const appliedJobs =
    appliedJobIds.length > 0
      ? await prisma.jobOffer.findMany({
          where: { id: { in: appliedJobIds } },
          select: activitySelect,
          orderBy: { createdAt: "desc" },
        })
      : [];

  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col gap-6 py-8 lg:flex-row lg:gap-8">
      <DashboardSidebar />

      <div className="min-w-0 flex-1">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={fullName}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-700"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                {initials || "AI"}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                {fullName}
              </h1>
              {headline ? (
                <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {headline}
                </p>
              ) : (
                <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  AI Expert
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Verification Status
            </p>
            <span
              className={`mt-3 inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                verified
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              {verified ? "Verified Expert" : "Pending Review"}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Profile Completeness
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-slate-100">
              {completeness}%
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/10">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${completeness}%` }}
              />
            </div>
            {completeness < 100 && (
              <Link
                href="/dashboard/edit"
                className="mt-4 inline-block text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
              >
                Complete your profile to unlock more opportunities
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Public Profile
            </p>
            {publicProfileUrl ? (
              <Link
                href={publicProfileUrl}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                View Profile
              </Link>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                Complete and publish your profile to get a public link.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <ProfileAvailability
            initialProfile={{
              hourlyRate: profile?.hourlyRate ?? "",
              skills,
              bio: profile?.bio ?? "",
              availability: profile?.availability ?? "Not Looking",
            }}
          />
        </div>

        <div className="mt-6">
          <RecommendedForYou skills={skills} />
        </div>

        <div className="mt-6">
          <Activity savedJobs={savedJobs} appliedJobs={appliedJobs} />
        </div>

        <div className="mt-6">
          <section className="rounded-card border border-white/10 bg-slate-800 p-6">
            <h2 className="text-lg font-bold tracking-tight text-white">
              Profile Overview
            </h2>

            {country || skills.length > 0 ? (
              <div className="mt-4 flex flex-col gap-4">
                {country && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </p>
                    <p className="mt-1 text-sm text-slate-200">{country}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Skills
                  </p>
                  {skills.length > 0 ? (
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
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      No skills added yet.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                Complete your profile to showcase your location and skills to
                AI labs and platforms.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}