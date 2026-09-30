import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safeRead } from "@/lib/safeQuery";
import AuthNav from "./AuthNav";
import MobileNavMenu from "./MobileNavMenu";
import SafeImage from "@/components/SafeImage";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "AI Platforms", href: "/platforms" },
  { label: "Experts", href: "/experts" },
  { label: "For Companies", href: "/for-companies" },
  { label: "Blog", href: "/blog" },
];

export async function TopNav() {
  const seo = await safeRead(
    "top nav logo",
    () => prisma.seoSetting.findUnique({ where: { id: "global" } }),
    null,
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight"
          aria-label="AI Job Board home"
        >
          {seo?.logoUrl ? (
             
            <SafeImage
              src={seo.logoUrl}
              alt="Site Logo"
              width={32}
              height={32}
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
          <MobileNavMenu items={navItems} />
        </div>
      </div>
    </nav>
  );
}

export default TopNav;