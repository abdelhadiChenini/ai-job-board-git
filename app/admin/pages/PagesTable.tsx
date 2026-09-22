"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Modal from "../Modal";
import { cardClass, inputClass, primaryBtn, subtleBtn } from "../ui";
import RichTextEditor from "./RichTextEditor";

type ApiPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  title: string;
  slug: string;
  content: string;
};

const emptyForm: FormState = { title: "", slug: "", content: "" };

export function PagesTable() {
  const [records, setRecords] = useState<ApiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPage | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setTableError(null);
    try {
      const response = await fetch("/api/admin/pages");
      const data: unknown = await response.json();
      if (!response.ok) {
        setLoadError(
          (data as { error?: string } | null)?.error ?? "Failed to load pages.",
        );
        return;
      }
      setRecords(Array.isArray(data) ? (data as ApiPage[]) : []);
    } catch {
      setLoadError("Network error while loading pages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = (field: keyof FormState) => (
    event: FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.currentTarget.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (record: ApiPage) => {
    setEditing(record);
    setForm({
      title: record.title,
      slug: record.slug,
      content: record.content,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase(),
      content: form.content,
    };
    if (editing) payload.id = editing.id;

    try {
      const response = await fetch("/api/admin/pages", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        setFormError(
          (data as { error?: string } | null)?.error ?? "Something went wrong.",
        );
        return;
      }

      await load();
      closeModal();
    } catch {
      setFormError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (record: ApiPage) => {
    if (!window.confirm(`Delete the page "${record.title}"?`)) return;
    setBusy(true);
    setTableError(null);
    try {
      const response = await fetch(
        `/api/admin/pages?id=${encodeURIComponent(record.id)}`,
        { method: "DELETE" },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setTableError(
          (data as { error?: string } | null)?.error ?? "Could not delete page.",
        );
        return;
      }
      await load();
    } catch {
      setTableError("Network error while deleting the page.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {loading
            ? "Loading…"
            : `${records.length} page${records.length === 1 ? "" : "s"}`}
        </p>
        <button type="button" onClick={openCreate} className={primaryBtn}>
          + Create New
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
          Fetching pages…
        </p>
      ) : records.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No pages yet. Click “Create New” to add one.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Title</th>
                <th className="pb-3 pr-4 font-semibold">Slug</th>
                <th className="pb-3 pr-4 font-semibold">Updated</th>
                <th className="pb-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t border-slate-700/60">
                  <td className="py-3 pr-4 text-white">{record.title}</td>
                  <td className="py-3 pr-4 font-mono text-slate-300">
                    <Link
                      href={`/pages/${record.slug}`}
                      target="_blank"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {record.slug}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {new Date(record.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(record)}
                      className="mr-3 text-sm font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Edit
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Edit "${editing.title}"` : "Create a new page"}
        onClose={closeModal}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Title
              <input
                type="text"
                required
                value={form.title}
                onChange={setField("title")}
                placeholder="Privacy Policy"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Slug
              <input
                type="text"
                value={form.slug}
                onChange={setField("slug")}
                placeholder="privacy-policy"
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Content
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
            />
          </label>

          {formError && (
            <p role="alert" className="text-sm text-red-400">
              {formError}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create page"}
            </button>
            <button
              type="button"
              onClick={closeModal}
              disabled={busy}
              className={subtleBtn}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}