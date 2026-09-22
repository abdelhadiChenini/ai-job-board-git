import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Edit Profile",
};

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/edit");
  }

  return (
    <div className="flex flex-col items-center py-12">
      <section className="w-full max-w-md rounded-card border border-white/10 bg-slate-800 p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Edit Profile
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Profile editing is coming soon. Your details can be updated from this
          section shortly.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Back to Dashboard
        </Link>
      </section>
    </div>
  );
}