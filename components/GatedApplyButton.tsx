"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { markApplied } from "@/app/dashboard/actions";
import type { ApplyBlockInfo } from "@/lib/subscription";
import ProLockedNotice from "@/components/ProLockedNotice";

type Props = {
  jobId: string;
  affiliateUrl: string;
  /**
   * Pre-computed paywall state from the server. Optional so the same control
   * works in contexts that have not rendered the gate yet — the click is still
   * re-checked server-side regardless, since a lock can appear between render
   * and click.
   */
  applyBlock?: ApplyBlockInfo | null;
  className?: string;
};

/**
 * An Apply button that goes through the server-side gate.
 *
 * Use this anywhere a user is offered a direct route to the external
 * application. A raw `<a href={affiliateUrl}>` bypasses `markApplied` entirely,
 * which lets a Free user reach a Pro-exclusive role simply by taking a
 * different path to the same button — the paywall is only as strong as its
 * least-guarded call site.
 */
export default function GatedApplyButton({
  jobId,
  affiliateUrl,
  applyBlock = null,
  className,
}: Props) {
  const [block, setBlock] = useState<ApplyBlockInfo | null>(applyBlock);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApply = () => {
    startTransition(async () => {
      setError(null);

      const result = await markApplied(jobId);

      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");

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

      setBlock(null);
      window.open(affiliateUrl, "_blank", "noopener,noreferrer");
    });
  };

  if (block) {
    return (
      <div className="space-y-2">
        <ProLockedNotice block={block} />
        <Link
          href="/pricing"
          className={
            className ??
            "inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          }
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleApply}
        disabled={isPending}
        className={
          className ??
          "inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        Apply
      </button>
      {error && (
        <p role="alert" className="text-center text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}