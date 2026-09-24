"use client";

import { useState, useTransition } from "react";
import {
  saveJob,
  removeSavedJob,
  markApplied,
} from "@/app/dashboard/actions";

type Props = {
  jobId: string;
  affiliateUrl: string;
  initialSaved: boolean;
  initialApplied: boolean;
};

export function OpportunityActions({
  jobId,
  affiliateUrl,
  initialSaved,
  initialApplied,
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [applied, setApplied] = useState(initialApplied);
  const [isPending, startTransition] = useTransition();

  const handleToggleSave = () => {
    startTransition(async () => {
      if (saved) {
        const result = await removeSavedJob(jobId);
        if (result.ok) {
          setSaved(false);
        }
      } else {
        const result = await saveJob(jobId);
        if (result.ok) {
          setSaved(true);
        }
      }
    });
  };

  const handleApply = () => {
    if (applied) {
      window.open(affiliateUrl, "_blank", "noopener,noreferrer");
      return;
    }

    startTransition(async () => {
      const result = await markApplied(jobId);
      if (result.ok) {
        setApplied(true);
      }
      window.open(affiliateUrl, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleApply}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {applied ? "Applied" : "Apply Now"}
      </button>
      <button
        type="button"
        onClick={handleToggleSave}
        disabled={isPending}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 py-3 font-semibold text-slate-300 transition-colors hover:border-blue-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saved ? "Saved" : "Save for Later"}
      </button>
    </>
  );
}