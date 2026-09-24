"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { saveJob, removeSavedJob } from "@/app/dashboard/actions";

type Props = {
  jobId: string;
  initialSaved?: boolean;
};

export function SaveJobButton({ jobId, initialSaved = false }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const handleToggle = () => {
    if (isPending) {
      return;
    }

    const next = !saved;
    setSaved(next);

    startTransition(async () => {
      const result = next ? await saveJob(jobId) : await removeSavedJob(jobId);

      if (!result.ok) {
        setSaved(!next);
        if (result.error === "You must be signed in.") {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        }
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={
        saved ? "Remove from saved opportunities" : "Save opportunity"
      }
      title={saved ? "Remove from saved" : "Save opportunity"}
      className={`relative z-20 -m-1.5 flex h-8 w-8 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        saved
          ? "border-blue-500/50 bg-blue-500/15 text-blue-400"
          : "border-white/10 bg-slate-950/60 text-slate-400 hover:border-blue-500/40 hover:text-blue-300"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
        />
      </svg>
    </button>
  );
}