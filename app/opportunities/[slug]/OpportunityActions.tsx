"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  saveJob,
  removeSavedJob,
  markApplied,
} from "@/app/dashboard/actions";
import UpgradeButton from "@/app/components/UpgradeButton";
import ProLockedNotice from "@/components/ProLockedNotice";
import {
  EARLY_ACCESS_FORBIDDEN_MESSAGE,
  type ApplyBlockInfo,
} from "@/lib/subscription";

type Props = {
  jobId: string;
  affiliateUrl: string;
  initialSaved: boolean;
  initialApplied: boolean;
  applyBlock: ApplyBlockInfo | null;
};

export function OpportunityActions({
  jobId,
  affiliateUrl,
  initialSaved,
  initialApplied,
  applyBlock,
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [applied, setApplied] = useState(initialApplied);
  const [block, setBlock] = useState<ApplyBlockInfo | null>(applyBlock);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);

      const result = await markApplied(jobId);

      if (!result.ok) {
        setError(
          result.blockedReason === "early_access"
            ? EARLY_ACCESS_FORBIDDEN_MESSAGE
            : (result.error ?? "Something went wrong."),
        );

        // The server is authoritative: a lock can appear between render and
        // click, so mirror any block it reports instead of opening the link.
        if (result.blockedReason === "early_access") {
          setBlock({
            reason: "early_access",
            unlocksAt: result.unlocksAt ?? "",
            countdown: result.unlockCountdown ?? "",
          });
        } else if (result.blockedReason === "daily_limit") {
          setBlock({
            reason: "daily_limit",
            used: result.used ?? 0,
            limit: result.limit ?? 0,
          });
        }

        return;
      }

      setApplied(true);
      setBlock(null);
      window.open(affiliateUrl, "_blank", "noopener,noreferrer");
    });
  };

  const isBlocked = !applied && block !== null;

  return (
    <>
      {isBlocked && block ? (
        <>
          <ProLockedNotice block={block} />
          <UpgradeButton />
          <Link
            href="/pricing"
            className="block text-center text-xs font-semibold text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
          >
            Upgrade to Pro
          </Link>
        </>
      ) : (
        <button
          type="button"
          onClick={handleApply}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {applied ? "Applied" : "Apply Now"}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-3 text-center text-xs text-rose-300">
          {error}
        </p>
      )}

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
