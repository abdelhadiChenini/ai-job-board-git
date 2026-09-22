"use client";

import { useState } from "react";

const starIcon = (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" />
  </svg>
);

const pillFilters = [
  {
    label: "All Opportunities",
    className: "bg-blue-600 text-white hover:bg-blue-500",
  },
  {
    label: "New",
    className:
      "border border-white/15 bg-slate-800 text-white hover:bg-slate-700",
    icon: starIcon,
  },
  {
    label: "Trending",
    className:
      "border border-white/25 text-slate-200 hover:bg-white/10 hover:text-white",
  },
];

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
          placeholder="Search jobs, skills or keywords..."
          aria-label="Search jobs, skills or keywords"
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

      <div className="flex flex-wrap items-center gap-2">
        {pillFilters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            aria-pressed={activePill === filter.label}
            onClick={() => setActivePill(filter.label)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
              activePill === filter.label ? "opacity-100" : "opacity-70"
            } ${filter.className}`}
          >
            {filter.icon}
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SearchBar;