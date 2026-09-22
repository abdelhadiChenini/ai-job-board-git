"use client";

import { useState } from "react";

const pillFilters = ["All Opportunities", "New", "Trending"];

const chevron = (
  <svg
    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
      clipRule="evenodd"
    />
  </svg>
);

export function SearchBar() {
  const [activePill, setActivePill] = useState("All Opportunities");

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5">
      <form
        role="search"
        aria-label="Search jobs"
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-col items-stretch gap-2 rounded-2xl bg-white p-2.5 shadow-xl shadow-black/30 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:gap-0 lg:p-2"
      >
        <input
          type="text"
          name="q"
          placeholder="Search jobs, skills..."
          aria-label="Search jobs, skills"
          className="w-full rounded-xl bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none lg:h-full"
        />

        <div className="relative lg:border-l lg:border-slate-200">
          <select
            name="category"
            defaultValue=""
            aria-label="All categories"
            className="h-full w-full appearance-none bg-transparent px-4 py-3.5 pr-10 text-sm text-slate-600 focus:outline-none"
          >
            <option value="">All categories</option>
          </select>
          {chevron}
        </div>

        <div className="relative lg:border-l lg:border-slate-200">
          <select
            name="company"
            defaultValue=""
            aria-label="All companies"
            className="h-full w-full appearance-none bg-transparent px-4 py-3.5 pr-10 text-sm text-slate-600 focus:outline-none"
          >
            <option value="">All companies</option>
          </select>
          {chevron}
        </div>

        <div className="relative lg:border-l lg:border-slate-200">
          <select
            name="location"
            defaultValue=""
            aria-label="All locations"
            className="h-full w-full appearance-none bg-transparent px-4 py-3.5 pr-10 text-sm text-slate-600 focus:outline-none"
          >
            <option value="">All locations</option>
          </select>
          {chevron}
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700 lg:h-full"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {pillFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={activePill === filter}
            onClick={() => setActivePill(filter)}
            className={
              activePill === filter
                ? "rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                : "rounded-full border border-white/25 px-5 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            }
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SearchBar;