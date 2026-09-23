import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create an Expert Account",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="flex w-full max-w-lg flex-col items-center">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-400">
            Expert Sign-up
          </span>
          <h1 className="mt-4 bg-gradient-to-r from-white via-blue-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Showcase your skills and get matched with AI work.
          </p>

          <div className="mt-8">
            <RegisterForm />
          </div>
        </section>

        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}