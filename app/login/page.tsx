import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log In",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center py-12">
      <section className="w-full max-w-md rounded-card border border-white/10 bg-slate-800 p-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Log in to your AI Job Board account to manage your profile.
        </p>

        <div className="mt-8">
          <LoginForm />
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
  );
}