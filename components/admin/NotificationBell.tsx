"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type NotificationData = {
  total: number;
  unreadMessages: number;
  newUsers: number;
};

const EMPTY: NotificationData = {
  total: 0,
  unreadMessages: 0,
  newUsers: 0,
};

export function NotificationBell() {
  const [data, setData] = useState<NotificationData>(EMPTY);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/admin/notifications");
        if (!response.ok) return;
        const payload: unknown = await response.json();
        if (!active || typeof payload !== "object" || payload === null) {
          return;
        }
        const counts = payload as Partial<NotificationData>;
        setData({
          total: Number(counts.total) || 0,
          unreadMessages: Number(counts.unreadMessages) || 0,
          newUsers: Number(counts.newUsers) || 0,
        });
      } catch {
        return;
      }
    };

    void load();
    const interval = setInterval(() => void load(), 60000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-label={`Notifications${data.total > 0 ? `, ${data.total} new` : ""}`}
        aria-expanded={open}
        className="relative rounded-xl border border-white/10 bg-slate-800 p-2.5 text-slate-300 transition-colors hover:border-slate-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <Bell className="h-5 w-5" />
        {data.total > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse border-2 border-slate-950" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notifications
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-300"
            >
              Close
            </button>
          </div>

          {data.total === 0 ? (
            <p className="text-sm text-slate-500">You&apos;re all caught up!</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.unreadMessages > 0 && (
                <li>
                  <Link
                    href="/admin/messages"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    You have {data.unreadMessages} unread message
                    {data.unreadMessages === 1 ? "" : "s"}
                  </Link>
                </li>
              )}
              {data.newUsers > 0 && (
                <li>
                  <Link
                    href="/admin/users"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    {data.newUsers} new expert
                    {data.newUsers === 1 ? "" : "s"} joined recently
                  </Link>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;