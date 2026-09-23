import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { calculateCompleteness } from "@/lib/completeness";
import { cardClass } from "../ui";

export const metadata: Metadata = {
  title: "Analytics",
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const [clicks, talentSignups, profiles, recentSignups] = await Promise.all([
    prisma.jobOffer.aggregate({ _sum: { clickCount: true } }),
    prisma.user.count({ where: { role: "EXPERT" } }),
    prisma.expertProfile.findMany({
      select: {
        bio: true,
        skills: true,
        hourlyRate: true,
        country: true,
        stateRegion: true,
        languages: true,
        education: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expertProfile: { select: { fullName: true } },
      },
    }),
  ]);

  const totalClicks = clicks._sum.clickCount ?? 0;
  const completedProfiles = profiles.filter(
    (profile) => calculateCompleteness(profile) === 100,
  ).length;

  const metrics: { label: string; value: string; hint: string }[] = [
    {
      label: "Total Platform Clicks",
      value: totalClicks.toLocaleString(),
      hint: "Clicks across all job postings",
    },
    {
      label: "Total Talent Signups",
      value: talentSignups.toLocaleString(),
      hint: "Expert accounts registered",
    },
    {
      label: "Fully Completed Profiles",
      value: completedProfiles.toLocaleString(),
      hint: `${profiles.length} profiles in total`,
    },
  ];

  const roleBadge = (role: string) =>
    role === "ADMIN"
      ? "rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400"
      : "rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-300";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Analytics
        </h1>
        <p className="text-sm text-slate-400">
          Platform performance and recent talent signups.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className={cardClass}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {metric.label}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-white">
              {metric.value}
            </p>
            <p className="mt-3 text-xs text-slate-500">{metric.hint}</p>
          </div>
        ))}
      </div>

      <section className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight text-white">
            Recent Activity
          </h2>
          <p className="text-sm text-slate-400">
            {recentSignups.length === 0
              ? "No signups yet"
              : `Latest ${recentSignups.length} signup${recentSignups.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {recentSignups.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No users have signed up yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Name</th>
                  <th className="pb-3 pr-4 font-semibold">Email</th>
                  <th className="pb-3 pr-4 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-slate-700/60 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="py-3 pr-4 text-white">
                      {user.expertProfile?.fullName ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{user.email}</td>
                    <td className="py-3 pr-4">
                      <span className={roleBadge(user.role)}>{user.role}</span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
