import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "View Public Profile",
};

export const dynamic = "force-dynamic";

export default async function ViewPublicProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/public");
  }

  const profile =
    session.user.id
      ? await prisma.expertProfile.findUnique({
          where: { userId: session.user.id },
        })
      : null;

  if (profile) {
    redirect(`/experts/${profile.userId}`);
  }

  redirect("/dashboard");
}