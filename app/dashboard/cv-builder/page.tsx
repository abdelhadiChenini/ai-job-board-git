import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan } from "@/lib/subscription";
import DashboardSidebar from "../DashboardSidebar";
import CvBuilder from "./CvBuilder";

export const metadata: Metadata = {
  title: "AI CV Builder",
};

export const dynamic = "force-dynamic";

/**
 * Renders the profile's JSON skills column back into the textarea form.
 *
 * The column is `Json`, so it can hold anything the schema never constrained.
 * Anything that is not an array of strings is treated as absent rather than
 * stringified into the form, which would prefill the box with `{"skills":…}`.
 */
function skillsToText(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .join(", ");
}

function joinLocation(...parts: (string | null | undefined)[]): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(", ");
}

/**
 * The CV builder, gated on PRO.
 *
 * The redirect here is for navigation, not enforcement — a user who never passes
 * through this page can still call the API directly, so `app/api/cv/route.ts`
 * repeats the same check and is the component that actually decides. Both exist
 * because the alternative is a Free user landing on a page of controls that
 * only fails after they have filled in the form.
 */
export default async function CvBuilderPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/cv-builder");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      plan: true,
      role: true,
      expertProfile: {
        select: {
          fullName: true,
          phoneNumber: true,
          stateRegion: true,
          country: true,
          websiteUrl: true,
          linkedInUrl: true,
          githubUrl: true,
          skills: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN" && normalizePlan(user.plan) !== "PRO") {
    redirect("/pricing?feature=cv-builder");
  }

  const profile = user.expertProfile;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <DashboardSidebar />

      <div className="min-w-0 flex-1 space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AI CV Builder
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Turn rough notes into a finished, role-targeted CV — then download it
            as a PDF.
          </p>
        </header>

        <CvBuilder
          initialPersonalInfo={{
            fullName: profile?.fullName ?? "",
            email: user.email ?? "",
            phone: profile?.phoneNumber ?? "",
            location: joinLocation(profile?.stateRegion, profile?.country),
            website: profile?.websiteUrl ?? "",
            linkedin: profile?.linkedInUrl ?? "",
            github: profile?.githubUrl ?? "",
          }}
          initialSkills={skillsToText(profile?.skills)}
        />
      </div>
    </div>
  );
}
