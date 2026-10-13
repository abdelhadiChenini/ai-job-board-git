"use client";

import { useState, type ReactNode } from "react";

/**
 * Switches the pricing page between the two audiences it serves.
 *
 * The panels are passed in as server-rendered nodes, so the tab machinery is
 * the only part that ships to the browser — every pricing card, comparison row
 * and CTA stays a server component.
 */
type Audience = "experts" | "companies";

const TABS: Array<{ id: Audience; label: string }> = [
  { id: "experts", label: "For Experts" },
  { id: "companies", label: "For Companies" },
];

export default function AudienceToggle({
  experts,
  companies,
}: {
  experts: ReactNode;
  companies: ReactNode;
}) {
  const [active, setActive] = useState<Audience>("experts");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Choose your audience"
        className="mx-auto flex w-full max-w-md items-center gap-1 rounded-full border border-white/10 bg-slate-900/80 p-1.5 backdrop-blur"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`pricing-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`pricing-panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isActive
                  ? "bg-accent text-slate-950"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`pricing-panel-${active}`}
        aria-labelledby={`pricing-tab-${active}`}
        className="mt-12"
      >
        {active === "experts" ? experts : companies}
      </div>
    </div>
  );
}
