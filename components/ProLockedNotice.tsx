import Link from "next/link";
import { Link2, Lock, Zap } from "lucide-react";
import type { ApplyBlockInfo } from "@/lib/subscription";

/**
 * The paywall shown in place of an Apply button when a user is not entitled to
 * apply yet.
 *
 * Deliberately imports only the *type* from `@/lib/subscription`: the runtime
 * module pulls in PrismaClient, which must never reach the browser bundle. Every
 * value rendered here is therefore computed and formatted on the server.
 *
 * Shared by the opportunity detail page and the dashboard's recommended list so
 * the two cannot drift into telling the same user different things.
 */
export default function ProLockedNotice({ block }: { block: ApplyBlockInfo }) {
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
          ? `Pro Exclusive: Unlocks for Free users in ${block.countdown}.`
          : `Daily Limit Reached (${block.used}/${block.limit})`}
      </p>
      <p className="text-xs leading-relaxed text-slate-300">
        {isEarlyAccess
          ? "Newly posted roles are reserved for Pro members during the first 48 hours. Upgrade to apply now instead of waiting."
          : "Upgrade to Pro for unlimited applications."}
      </p>
      <p
        className={
          isEarlyAccess
            ? "flex items-center gap-2 text-xs font-medium text-amber-200/80"
            : "flex items-center gap-2 text-xs font-medium text-blue-200/80"
        }
      >
        <Link2 aria-hidden="true" className="h-3 w-3 shrink-0" />
        See what Pro unlocks on the{" "}
        <Link
          href="/pricing"
          className="font-semibold underline underline-offset-2 hover:text-white"
        >
          pricing page
        </Link>
      </p>
    </div>
  );
}