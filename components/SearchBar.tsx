"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

type SearchBarProps = {
  companies: string[];
  categories: string[];
  locations: string[];
};

export default function SearchBar(props: SearchBarProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[228px] w-full max-w-5xl animate-pulse flex-col gap-5">
          <div className="rounded-2xl bg-white/10" />
          <div className="flex gap-2">
            <div className="h-9 w-32 rounded-full bg-white/10" />
            <div className="h-9 w-24 rounded-full bg-white/10" />
            <div className="h-9 w-24 rounded-full bg-white/10" />
          </div>
        </div>
      }
    >
      <SearchBarInner {...props} />
    </Suspense>
  );
}

function SearchBarInner({
  companies,
  categories,
  locations,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(
    searchParams.get("category") ?? "",
  );
  const [company, setCompany] = useState(searchParams.get("company") ?? "");
  const [location, setLocation] = useState(
    searchParams.get("location") ?? "",
  );
  const [activePill, setActivePill] = useState("All Opportunities");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (company) params.set("company", company);
    if (location) params.set("location", location);

    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : "?");
  };

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5">
      <form
        role="search"
        aria-label="Search jobs"
        onSubmit={handleSubmit}
        className="flex flex-col items-stretch gap-2 rounded-2xl bg-white p-2.5 shadow-xl shadow-black/30 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:gap-0 lg:p-2"
      >
        <input
          type="text"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search jobs, skills or keywords..."
          aria-label="Search jobs, skills or keywords"
          className="w-full rounded-xl bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none lg:h-full"
        />

        <div className="relative lg:border-l lg:border-slate-200">
          <select
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="All categories"
            className="h-full w-full appearance-none bg-transparent px-4 py-3.5 pr-10 text-sm text-slate-600 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((categoryOption) => (
              <option key={categoryOption} value={categoryOption}>
                {categoryOption}
              </option>
            ))}
          </select>
          {chevron}
        </div>

        <div className="relative lg:border-l lg:border-slate-200">
          <select
            name="company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            aria-label="All companies"
            className="h-full w-full appearance-none bg-transparent px-4 py-3.5 pr-10 text-sm text-slate-600 focus:outline-none"
          >
            <option value="">All companies</option>
            {companies.map((companyOption) => (
              <option key={companyOption} value={companyOption}>
                {companyOption}
              </option>
            ))}
          </select>
          {chevron}
        </div>

        <div className="relative lg:border-l lg:border-slate-200">
          <select
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            aria-label="All locations"
            className="h-full w-full appearance-none bg-transparent px-4 py-3.5 pr-10 text-sm text-slate-600 focus:outline-none"
          >
            <option value="">All locations</option>
            {locations.map((locationOption) => (
              <option key={locationOption} value={locationOption}>
                {locationOption}
              </option>
            ))}
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