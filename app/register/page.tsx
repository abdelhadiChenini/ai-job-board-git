import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create an Expert Account",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center py-12">
      <section className="w-full max-w-lg rounded-card bg-white p-8 shadow-2xl sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          Expert Sign-up
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Join as an AI Expert
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Create your account to showcase your skills and get matched with AI
          work.
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
  );
}