"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export function AuthNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading" || !session?.user) {
    if (status === "loading") {
      return (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm text-slate-500">
          …
        </span>
      );
    }

    return (
      <>
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
      </>
    );
  }

  const initial =
    session.user.name?.charAt(0).toUpperCase() ??
    session.user.email?.charAt(0).toUpperCase() ??
    "AI";
  const isAdmin = session.user.role === "ADMIN";
  const dashboardHref = isAdmin ? "/admin/users" : "/dashboard";

  const handleLogout = () => {
    setOpen(false);
    void signOut({ callbackUrl: "/login" });
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          session.user.name ? `Account menu for ${session.user.name}` : "Account menu"
        }
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-emerald-400 text-sm font-bold text-slate-950 transition-transform hover:scale-105"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">
              {session.user.name ?? "Expert"}
            </p>
            <p className="truncate text-xs text-slate-500">{session.user.email}</p>
          </div>
          <div className="p-2">
            <Link
              role="menuitem"
              href={dashboardHref}
              className="block rounded-xl px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {isAdmin ? "Admin Panel" : "My Dashboard"}
            </Link>
            {!isAdmin && session.user.id && (
              <Link
                role="menuitem"
                href={`/experts/${session.user.id}`}
                className="block rounded-xl px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Public Profile
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleLogout()}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-red-400"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthNav;