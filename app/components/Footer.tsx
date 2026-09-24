import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

const SETTING_KEYS = [
  "site_title",
  "site_description",
  "twitter_url",
  "linkedin_url",
  "github_url",
] as const;

const FALLBACKS: Record<string, string> = {
  site_title: "AI Job Board",
  site_description:
    "Connecting AI labs and platforms with vetted experts for model evaluation, data annotation and quality work.",
};

type Column = { title: string; links: { label: string; href: string }[] };

export async function Footer() {
  noStore();

  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
  });

  const get = (key: string) =>
    settings.find((setting) => setting.key === key)?.value ?? null;

  const siteTitle = get("site_title") ?? FALLBACKS.site_title;
  const siteDescription =
    get("site_description") ?? FALLBACKS.site_description;

  const socialLinks = (
    [
      { label: "Twitter", href: get("twitter_url") },
      { label: "LinkedIn", href: get("linkedin_url") },
      { label: "GitHub", href: get("github_url") },
    ] as { label: string; href: string | null }[]
  )
    .filter((link) => link.href !== null)
    .map((link) => ({ label: link.label, href: link.href as string }));

  const columns: Column[] = [
    {
      title: "Discover",
      links: [
        { label: "Opportunities", href: "/opportunities" },
        { label: "AI Platforms", href: "/platforms" },
        { label: "Experts", href: "/experts" },
        { label: "Latest Jobs", href: "/opportunities" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", href: "/blog" },
        { label: "Guides", href: "/guides" },
        { label: "FAQ", href: "/faq" },
        { label: "Support", href: "/contact" },
      ],
    },
    {
      title: "For Companies",
      links: [
        { label: "Post a Job", href: "/for-companies" },
        { label: "Hire Experts", href: "/for-companies" },
        { label: "Pricing", href: "/for-companies" },
        { label: "Contact Us", href: "/contact" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Log in", href: "/login" },
        { label: "Create Free Account", href: "/signup" },
        { label: "Settings", href: "/dashboard" },
        { label: "Privacy Policy", href: "/privacy" },
      ],
    },
  ];

  const footerLinks = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "mailto:contact@aijobboard.com" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
  ];

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
              <span className="text-lg tracking-tight">{siteTitle}</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              {siteDescription}
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
            &copy; {new Date().getFullYear()} {siteTitle}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            {socialLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-slate-500 transition-colors hover:text-slate-300"
              >
                {link.label}
              </Link>
            ))}
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