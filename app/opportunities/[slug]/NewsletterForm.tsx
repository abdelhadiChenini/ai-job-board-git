"use client";

import { FormEvent, useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          (data as { error?: string } | null)?.error ??
            "Could not subscribe. Try again.",
        );
        return;
      }
      setSubscribed(true);
    } catch {
      setError("Network error. Try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      />
      <button
        type="submit"
        disabled={subscribed}
        className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-default disabled:bg-emerald-600 sm:w-auto"
      >
        {subscribed ? "Subscribed" : "Subscribe"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}

export default NewsletterForm;