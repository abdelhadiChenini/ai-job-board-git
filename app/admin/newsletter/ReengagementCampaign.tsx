"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { cardClass, inputClass, primaryBtn } from "../ui";

type Toast = {
  id: number;
  tone: "success" | "error";
  message: string;
};

type SendResponse = {
  sent?: number;
  failed?: number;
  message?: string;
  error?: string;
};

const toastTone = {
  success: "border-emerald-500/40 bg-emerald-950/90 text-emerald-200",
  error: "border-red-500/40 bg-red-950/90 text-red-200",
} as const;

export function ReengagementCampaign({
  recipientCount,
}: {
  recipientCount: number;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(0);

  const pushToast = useCallback((tone: Toast["tone"], text: string) => {
    const id = nextToastId.current++;
    setToasts((current) => [...current, { id, tone, message: text }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 6000);
  }, []);

  // Best-effort confirmation before a campaign that cannot be unsent.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isSubmitting) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isSubmitting]);

  const canSubmit =
    subject.trim().length > 0 &&
    message.trim().length > 0 &&
    recipientCount > 0 &&
    !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/marketing/resend-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = (await response.json()) as SendResponse;

      if (!response.ok) {
        pushToast("error", data.error ?? "The campaign could not be sent.");
        return;
      }

      pushToast("success", data.message ?? "Campaign sent.");
      setSubject("");
      setMessage("");
    } catch {
      pushToast("error", "Network error while sending the campaign.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={cardClass}>
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-white">
          Profile re-engagement campaign
        </h2>
        <p className="text-sm text-slate-400">
          Sends a reminder to every expert whose profile is still incomplete.
          Experts who opted out of marketing email are skipped automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-300">Subject line</span>
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={150}
            required
            placeholder="Your profile is almost ready to apply"
            disabled={isSubmitting}
            className={inputClass}
          />
          <span className="text-xs text-slate-500">
            {subject.length}/150 characters
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-300">Message</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={5000}
            required
            rows={8}
            placeholder="Hi there — you're only a few fields away from unlocking applications from companies hiring in your area of expertise."
            disabled={isSubmitting}
            className={`${inputClass} resize-y leading-relaxed`}
          />
          <span className="text-xs text-slate-500">
            {message.length}/5000 characters. Blank lines become new paragraphs.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className={primaryBtn}
          >
            {isSubmitting
              ? "Sending campaign…"
              : `Send re-engagement campaign to ${recipientCount} expert${recipientCount === 1 ? "" : "s"}`}
          </button>
          {recipientCount === 0 && (
            <p className="text-sm text-slate-500">
              No experts are waiting on a nudge right now.
            </p>
          )}
        </div>
      </form>

      <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg shadow-black/40 ${toastTone[toast.tone]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </section>
  );
}

export default ReengagementCampaign;