"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { cardClass, subtleBtn } from "../ui";

type ApiMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export function MessagesTable() {
  const [records, setRecords] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setTableError(null);
    try {
      const response = await fetch("/api/admin/messages");
      const data: unknown = await response.json();
      if (!response.ok) {
        setLoadError(
          (data as { error?: string } | null)?.error ??
            "Failed to load messages.",
        );
        return;
      }
      setRecords(Array.isArray(data) ? (data as ApiMessage[]) : []);
    } catch {
      setLoadError("Network error while loading messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (record: ApiMessage, isRead: boolean) => {
    setBusy(true);
    setTableError(null);
    try {
      const response = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, isRead }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        setTableError(
          (data as { error?: string } | null)?.error ??
            "Could not update the message.",
        );
        return;
      }
      await load();
    } catch {
      setTableError("Network error while updating the message.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (record: ApiMessage) => {
    if (!window.confirm(`Delete the message from "${record.name}"?`)) return;
    setBusy(true);
    setTableError(null);
    try {
      const response = await fetch(
        `/api/admin/messages?id=${encodeURIComponent(record.id)}`,
        { method: "DELETE" },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setTableError(
          (data as { error?: string } | null)?.error ??
            "Could not delete the message.",
        );
        return;
      }
      await load();
    } catch {
      setTableError("Network error while deleting the message.");
    } finally {
      setBusy(false);
    }
  };

  const unreadCount = records.filter((record) => !record.isRead).length;

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {loading
            ? "Loading…"
            : `${records.length} message${records.length === 1 ? "" : "s"} · ${unreadCount} unread`}
        </p>
        <button type="button" onClick={() => void load()} className={subtleBtn}>
          Refresh
        </button>
      </div>

      {loadError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span>{loadError}</span>
          <button type="button" onClick={() => void load()} className={subtleBtn}>
            Retry
          </button>
        </div>
      )}

      {tableError && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {tableError}
        </p>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Fetching messages…
        </p>
      ) : records.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No messages yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">From</th>
                <th className="pb-3 pr-4 font-semibold">Subject</th>
                <th className="pb-3 pr-4 font-semibold">Received</th>
                <th className="pb-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const isExpanded = expanded === record.id;
                return (
                  <Fragment key={record.id}>
                    <tr
                      className={`border-t border-slate-700/60 ${record.isRead ? "" : "bg-blue-600/5"}`}
                    >
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            record.isRead
                              ? "bg-slate-700/40 text-slate-400"
                              : "bg-blue-600/20 text-blue-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              record.isRead ? "bg-slate-500" : "bg-blue-400"
                            }`}
                          />
                          {record.isRead ? "Read" : "New"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-semibold text-white">
                          {record.name}
                        </span>
                        <a
                          href={`mailto:${record.email}`}
                          className="block text-xs text-blue-400 hover:text-blue-300"
                        >
                          {record.email}
                        </a>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded(isExpanded ? null : record.id)
                          }
                          className="text-left font-medium text-slate-200 hover:text-white"
                        >
                          {record.subject}
                        </button>
                        {isExpanded && (
                          <p className="mt-2 whitespace-pre-line rounded-lg border border-slate-700/60 bg-slate-900/60 p-3 text-sm leading-relaxed text-slate-300">
                            {record.message}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-400">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void markRead(record, !record.isRead)}
                          disabled={busy}
                          className="mr-3 text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-60"
                        >
                          {record.isRead ? "Mark unread" : "Mark read"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(record)}
                          disabled={busy}
                          className="text-sm font-semibold text-red-400 hover:text-red-300 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default MessagesTable;