import Link from "next/link";

const navItems = [
  { label: "Opportunities", href: "/" },
  { label: "AI Platforms", href: "/platforms" },
  { label: "Experts", href: "/experts" },
  { label: "For Companies", href: "/for-companies" },
];

export function TopNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight"
          aria-label="AI Job Board home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-emerald-400 text-sm font-bold text-slate-950">
            AI
          </span>
          <span className="hidden bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-lg tracking-tight text-transparent sm:inline">
            Job Board
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-0">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-accent/60"
          >
            Join
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default TopNav;