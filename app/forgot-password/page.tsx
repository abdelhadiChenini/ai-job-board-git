import type { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="bg-gradient-to-r from-white via-blue-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email address and we will send you a link to reset your
            password.
          </p>

          <div className="mt-8">
            <Suspense>
              <ForgotPasswordForm />
            </Suspense>
          </div>
        </section>

        <p className="mt-6 text-sm text-slate-400">
          Remembered it?{" "}
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