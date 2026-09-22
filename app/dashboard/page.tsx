import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardSidebar from "./DashboardSidebar";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

const statuses = [
  { label: "APPLICATIONS", value: "0" },
  { label: "IN PROGRESS", value: "0" },
  { label: "SHORTLISTED / HIRED", value: "0" },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const profile = session.user.id
    ? await prisma.expertProfile.findUnique({
        where: { userId: session.user.id },
      })
    : null;

  const fullName = profile?.fullName ?? session.user.email ?? "Expert";
  const headline = profile?.headline ?? "";
  const country = profile?.country ?? "";
  const skills = Array.isArray(profile?.skills)
    ? (profile.skills as string[])
    : [];
  const photo = profile?.profilePicture ?? null;
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
        <section className="rounded-card bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={fullName}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-200"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                {initials || "AI"}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {fullName}
              </h1>
              {headline ? (
                <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-blue-600">
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
          {statuses.map((stat) => (
            <div
              key={stat.label}
              className="rounded-card border border-white/10 bg-slate-800 p-5"
            >
              <p className="text-3xl font-bold tracking-tight text-white">
                {stat.value}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
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

          <section className="rounded-card border border-dashed border-white/15 bg-slate-800/60 p-6">
            <h2 className="text-lg font-bold tracking-tight text-white">
              My Applications
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              You haven&rsquo;t applied to any opportunities yet. Start
              exploring curated AI roles and tracking them here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Browse opportunities
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}