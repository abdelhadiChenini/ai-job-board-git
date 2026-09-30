"use client";

import { useState, useTransition } from "react";
import { Lock, Zap } from "lucide-react";
import {
  saveJob,
  removeSavedJob,
  markApplied,
} from "@/app/dashboard/actions";
import UpgradeButton from "@/app/components/UpgradeButton";
import type { ApplyBlockInfo } from "@/lib/subscription";

type Props = {
  jobId: string;
  affiliateUrl: string;
  initialSaved: boolean;
  initialApplied: boolean;
  applyBlock: ApplyBlockInfo | null;
};

function BlockedPanel({ block }: { block: ApplyBlockInfo }) {
  const isEarlyAccess = block.reason === "early_access";

  return (
    <div
      role="alert"
      className={
        isEarlyAccess
          ? "flex flex-col gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4"
          : "flex flex-col gap-2 rounded-xl border border-blue-400/40 bg-blue-500/10 p-4"
      }
    >
      <p
        className={
          isEarlyAccess
            ? "flex items-center gap-2 text-sm font-bold text-amber-300"
            : "flex items-center gap-2 text-sm font-bold text-blue-300"
        }
      >
        {isEarlyAccess ? (
          <Lock aria-hidden="true" className="h-4 w-4 shrink-0" />
        ) : (
          <Zap aria-hidden="true" className="h-4 w-4 shrink-0" />
        )}
        {isEarlyAccess
          ? `Locked: Pro Early Access (Unlocks in ${block.countdown})`
          : `Daily Limit Reached (${block.used}/${block.limit})`}
      </p>
      <p className="text-xs leading-relaxed text-slate-300">
        {isEarlyAccess
          ? "Newly posted roles are reserved for Pro members during the first 48 hours. Upgrade to apply now instead of waiting."
          : "Upgrade to Pro for unlimited applications."}
      </p>
    </div>
  );
}

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
        setError(result.error ?? "Something went wrong.");

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
          <BlockedPanel block={block} />
          <UpgradeButton />
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
