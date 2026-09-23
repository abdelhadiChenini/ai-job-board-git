"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const AVAILABILITY_OPTIONS = ["Available", "Not Looking"];

const SPECIALTY_OPTIONS = [
  "Data Annotation",
  "LLM Evaluation",
  "Translation",
  "Arabic",
  "French",
  "Python",
];

const activePill =
  "rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-3 py-1 text-sm font-semibold text-white transition-colors";
const idlePill =
  "rounded-full bg-slate-800 px-3 py-1 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200";

export function FilterSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const toggleAvailability = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("availability") === value) {
      params.delete("availability");
    } else {
      params.set("availability", value);
    }
    updateUrl(params);
  };

  const toggleSpecialty = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll("specialty");
    if (current.some((item) => item === value)) {
      params.delete("specialty");
      current.forEach((item) => {
        if (item !== value) params.append("specialty", item);
      });
    } else {
      params.append("specialty", value);
    }
    updateUrl(params);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("availability");
    params.delete("specialty");
    updateUrl(params);
  };

  const availability = searchParams.get("availability");
  const specialties = searchParams.getAll("specialty");
  const hasFilters = Boolean(availability) || specialties.length > 0;

  return (
    <div className="sticky top-24 flex flex-col gap-7 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Filters</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-accent transition-colors hover:text-blue-200"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Availability
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {AVAILABILITY_OPTIONS.map((option) => {
            const isActive = availability === option;
            return (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => toggleAvailability(option)}
                  className={isActive ? activePill : idlePill}
                  aria-pressed={isActive}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Specialty
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map((option) => {
            const isActive = specialties.includes(option);
            return (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => toggleSpecialty(option)}
                  className={isActive ? activePill : idlePill}
                  aria-pressed={isActive}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default FilterSidebar;