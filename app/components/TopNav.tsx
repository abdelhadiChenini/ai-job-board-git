import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AuthNav from "./AuthNav";

const navItems = [
  { label: "Opportunities", href: "/opportunities" },
  { label: "AI Platforms", href: "/platforms" },
  { label: "Experts", href: "/experts" },
  { label: "For Companies", href: "/for-companies" },
  { label: "Blog", href: "/blog" },
];

export async function TopNav() {
  const seo = await prisma.seoSetting.findUnique({ where: { id: "global" } });

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-4 px-6 py-4 md:px-12">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight"
          aria-label="AI Job Board home"
        >
          {seo?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seo.logoUrl}
              alt="Site Logo"
              className="h-8 w-auto object-contain"
            />
          ) : (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-emerald-400 text-sm font-bold text-slate-950">
                AI
              </span>
              <span className="hidden bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-lg tracking-tight text-transparent sm:inline">
                Job Board
              </span>
            </>
          )}
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
          <AuthNav />
        </div>
      </div>
    </nav>
  );
}

export default TopNav;