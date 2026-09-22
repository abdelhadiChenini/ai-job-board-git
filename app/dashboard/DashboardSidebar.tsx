"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/edit", label: "Edit Profile" },
  { href: "/dashboard/public", label: "View Public Profile" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    active
      ? "rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
      : "rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white";

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <aside className="shrink-0 lg:w-56">
      <nav
        aria-label="Dashboard navigation"
        className="flex flex-row flex-wrap gap-2 rounded-card border border-white/10 bg-slate-800 p-3 lg:sticky lg:top-24 lg:flex-col lg:gap-1"
      >
        <p className="hidden w-full px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:block">
          My account
        </p>

        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? "page" : undefined}
            className={linkClass(isActive(link.href))}
          >
            {link.label}
          </Link>
        ))}

        <p className="hidden w-full px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:block">
          General
        </p>

        <Link href="/" className={linkClass(false)}>
          Back to site
        </Link>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}

export default DashboardSidebar;