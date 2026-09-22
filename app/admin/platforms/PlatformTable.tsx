"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Modal from "../Modal";
import { cardClass, inputClass, primaryBtn, subtleBtn } from "../ui";

type ApiPlatform = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { jobOffers: number };
};

type FormState = {
  name: string;
  slug: string;
  websiteUrl: string;
  description: string;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  websiteUrl: "",
  description: "",
};

export function PlatformTable() {
  const [records, setRecords] = useState<ApiPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPlatform | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setTableError(null);
    try {
      const response = await fetch("/api/admin/platforms");
      const data: unknown = await response.json();
      if (!response.ok) {
        setLoadError(
          (data as { error?: string } | null)?.error ?? "Failed to load platforms.",
        );
        return;
      }
      setRecords(Array.isArray(data) ? (data as ApiPlatform[]) : []);
    } catch {
      setLoadError("Network error while loading platforms.");
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
    setForm((prev) => ({ ...prev, [field]: event.currentTarget.value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (record: ApiPlatform) => {
    setEditing(record);
    setForm({
      name: record.name,
      slug: record.slug,
      websiteUrl: record.websiteUrl ?? "",
      description: record.description ?? "",
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
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      websiteUrl: form.websiteUrl.trim(),
      description: form.description,
    };
    if (editing) payload.id = editing.id;

    try {
      const response = await fetch("/api/admin/platforms", {
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

  const remove = async (record: ApiPlatform) => {
    if (!window.confirm(`Delete the platform "${record.name}"?`)) return;
    setBusy(true);
    setTableError(null);
    try {
      const response = await fetch(
        `/api/admin/platforms?id=${encodeURIComponent(record.id)}`,
        { method: "DELETE" },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setTableError(
          (data as { error?: string } | null)?.error ?? "Could not delete platform.",
        );
        return;
      }
      await load();
    } catch {
      setTableError("Network error while deleting the platform.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {loading ? "Loading…" : `${records.length} platform${records.length === 1 ? "" : "s"}`}
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
          Fetching platforms…
        </p>
      ) : records.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No platforms yet. Click “Create New” to add one.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Name</th>
                <th className="pb-3 pr-4 font-semibold">Slug</th>
                <th className="pb-3 pr-4 font-semibold">Website</th>
                <th className="pb-3 pr-4 font-semibold">Opportunities</th>
                <th className="pb-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t border-slate-700/60">
                  <td className="py-3 pr-4 text-white">{record.name}</td>
                  <td className="py-3 pr-4 font-mono text-slate-300">
                    {record.slug}
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {record.websiteUrl ? (
                      <a
                        href={record.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {record.websiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-300">
                    {record._count.jobOffers}
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
        title={editing ? `Edit "${editing.name}"` : "Create a new platform"}
        onClose={closeModal}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Name
              <input
                type="text"
                required
                value={form.name}
                onChange={setField("name")}
                placeholder="Scale AI"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Slug
              <input
                type="text"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={form.slug}
                onChange={setField("slug")}
                placeholder="scale-ai"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Website URL
              <input
                type="url"
                value={form.websiteUrl}
                onChange={setField("websiteUrl")}
                placeholder="https://scale.com"
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={setField("description")}
              placeholder="Short description of the platform…"
              className={inputClass}
            />
          </label>

          {formError && (
            <p role="alert" className="text-sm text-red-400">
              {formError}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create platform"}
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

export default PlatformTable;