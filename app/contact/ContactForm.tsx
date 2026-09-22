"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-slate-700";

const primaryBtn =
  "inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60";

export function ContactForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        setError(
          (data as { error?: string } | null)?.error ??
            "Something went wrong. Please try again.",
        );
        return;
      }

      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-semibold text-emerald-700">
          Thanks! Your message has been sent.
        </p>
        <p className="text-sm text-emerald-700/90">
          Our team will get back to you as soon as possible.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-1 w-fit rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Name
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Yacine Benali"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        Subject
        <input
          type="text"
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Partnership enquiry"
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        Message
        <textarea
          rows={7}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="How can we help?"
          className={`${inputClass} resize-y`}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className={primaryBtn}>
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

export default ContactForm;