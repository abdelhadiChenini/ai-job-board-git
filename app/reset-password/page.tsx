import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { hashResetToken, isResetTokenExpired } from "@/lib/password-reset";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
};

// The token is checked against the database on every render.
export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
          {children}
        </section>

        <p className="mt-6 text-sm text-slate-400">
          Changed your mind?{" "}
          <a
            href="/login"
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}

function InvalidLink({ expired }: { expired?: boolean }) {
  return (
    <Shell>
      <h1 className="bg-gradient-to-r from-white via-blue-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
        Link no longer valid
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        {expired
          ? "This reset link has expired. Request a new one and try again."
          : "This reset link is invalid or has already been used. Request a new one and try again."}
      </p>

      <a
        href="/forgot-password"
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Request a new reset link
      </a>
    </Shell>
  );
}

export default async function ResetPasswordPage({
  searchParams: sp,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const searchParams = await sp;

  // `?token=a&token=b` arrives as an array; only the first value is used.
  const raw = searchParams?.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  if (!token) {
    return <InvalidLink />;
  }

  // The token is checked here as well as in the action so a dead link never
  // renders a form that can only fail.
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: hashResetToken(token) },
    select: { expires: true },
  });

  if (!resetToken) {
    return <InvalidLink />;
  }

  if (isResetTokenExpired(resetToken.expires)) {
    return <InvalidLink expired />;
  }

  return (
    <Shell>
      <h1 className="bg-gradient-to-r from-white via-blue-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
        Create new password
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Choose a strong new password for your account.
      </p>

      <div className="mt-8">
        <Suspense>
          <ResetPasswordForm token={token} />
        </Suspense>
      </div>
    </Shell>
  );
}
