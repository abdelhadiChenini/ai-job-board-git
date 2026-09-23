"use client";

import { useState } from "react";

export function ShareJobButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className="mt-3 w-full rounded-xl border border-slate-700 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-800"
    >
      {copied ? "Link copied!" : "Share Job"}
    </button>
  );
}

export default ShareJobButton;