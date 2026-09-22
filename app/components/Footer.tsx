import Link from "next/link";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Discover",
    links: [
      { label: "Opportunities", href: "/" },
      { label: "AI Platforms", href: "/#ai-platforms" },
      { label: "Experts", href: "/experts" },
      { label: "Latest Jobs", href: "/#latest" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/" },
      { label: "Guides", href: "/" },
      { label: "FAQ", href: "/" },
      { label: "Support", href: "/" },
    ],
  },
  {
    title: "For Companies",
    links: [
      { label: "Post a Job", href: "/" },
      { label: "Hire Experts", href: "/" },
      { label: "Pricing", href: "/" },
      { label: "Contact Us", href: "/" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create Free Account", href: "/signup" },
      { label: "Settings", href: "/" },
      { label: "Privacy Policy", href: "/" },
    ],
  },
];

const footerLinks = [
  { label: "About", href: "/" },
  { label: "Contact", href: "/" },
  { label: "Terms", href: "/" },
  { label: "Privacy", href: "/" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy" aria-label="Footer">
      <div className="site-shell">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto]">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Find AI work. Or find the talent to get it done.
          </h2>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700"
          >
            Create Free Account
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 font-bold text-white"
              aria-label="AI Job Board home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                AI
              </span>
              <span className="text-lg tracking-tight">Job Board</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Connecting AI labs and platforms with vetted experts for model
              evaluation, data annotation and quality work.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} AI Job Board. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-slate-500 transition-colors hover:text-slate-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;