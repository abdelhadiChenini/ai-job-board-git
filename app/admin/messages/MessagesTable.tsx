"use client";

import { FormEvent, Fragment, useCallback, useEffect, useState } from "react";
import Modal from "../Modal";
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
  const [replyTarget, setReplyTarget] = useState<ApiMessage | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  const openReply = (record: ApiMessage) => {
    setReplyTarget(record);
    setReplyBody("");
    setReplyError(null);
  };

  const closeReply = () => {
    setReplyTarget(null);
    setReplyBody("");
    setReplyError(null);
  };

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!replyTarget || !replyBody.trim()) return;
    setSendingReply(true);
    setReplyError(null);
    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: replyTarget.email,
          subject: `Re: ${replyTarget.subject}`,
          html: replyBody.replace(/\n/g, "<br />"),
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setReplyError(
          (data as { error?: string } | null)?.error ??
            "Could not send the reply.",
        );
        return;
      }
      closeReply();
    } catch {
      setReplyError("Network error. Try again.");
    } finally {
      setSendingReply(false);
    }
  };

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
    <>
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
                          onClick={() => openReply(record)}
                          disabled={busy}
                          className="mr-3 text-sm font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-60"
                        >
                          Reply
                        </button>
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

      <Modal
      open={replyTarget !== null}
      title={replyTarget ? `Reply to ${replyTarget.name}` : "Reply"}
      onClose={closeReply}
    >
      {replyTarget && (
        <form onSubmit={sendReply} className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm">
            <p className="text-slate-300">
              <span className="font-semibold text-white">To:</span>{" "}
              {replyTarget.email}
            </p>
            <p className="mt-1 text-slate-300">
              <span className="font-semibold text-white">Subject:</span> Re:{" "}
              {replyTarget.subject}
            </p>
          </div>

          <textarea
            rows={5}
            required
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            placeholder="Write your reply…"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />

          {replyError && (
            <p role="alert" className="text-sm text-red-400">
              {replyError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={sendingReply}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {sendingReply ? "Sending…" : "Send reply"}
            </button>
            <button
              type="button"
              onClick={closeReply}
              disabled={sendingReply}
              className="inline-flex items-center justify-center rounded-full border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
    </>
  );
}

export default MessagesTable;