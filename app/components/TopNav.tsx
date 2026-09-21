import Link from "next/link";

const navItems = [
  { label: "Opportunities", href: "/" },
  { label: "AI Platforms", href: "/#ai-platforms" },
  { label: "Experts", href: "/experts" },
  { label: "For Companies", href: "/#for-companies" },
];

export function TopNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-bold text-slate-900"
          aria-label="AI Job Board home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            AI
          </span>
          <span className="hidden text-lg tracking-tight sm:inline">
            Job Board
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-700 transition-colors hover:text-blue-600"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-0">
          <Link
            href="/login"
            className="px-2 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700"
          >
            Join
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default TopNav;