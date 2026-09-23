import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log In",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="bg-gradient-to-r from-white via-blue-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Log in to your AI Job Board account to manage your profile.
          </p>

          <div className="mt-8">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </section>

        <p className="mt-6 text-sm text-slate-400">
          New here?{" "}
          <a
            href="/register"
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            Create a free account
          </a>
        </p>
      </div>
    </div>
  );
}