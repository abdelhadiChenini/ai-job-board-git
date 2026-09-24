"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Modal from "../Modal";
import RichTextEditor from "../pages/RichTextEditor";
import AIAssistantButton from "@/components/admin/AIAssistantButton";
import { cardClass, inputClass, primaryBtn, subtleBtn } from "../ui";

type ApiOpportunity = {
  id: string;
  title: string;
  description: string;
  aiLabName: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  tags: unknown;
  affiliateUrl: string;
  category: string | null;
  region: string | null;
  badge: string | null;
  platformId: string;
  platform: { id: string; name: string; slug: string };
  createdAt: string;
  updatedAt: string;
};

type ApiPlatform = { id: string; name: string; slug: string };

type ApiCategory = { id: string; name: string };

type FormState = {
  title: string;
  aiLabName: string;
  description: string;
  affiliateUrl: string;
  currency: string;
  salaryMin: string;
  salaryMax: string;
  platformId: string;
  tags: string;
  category: string;
  region: string;
  badge: string;
};

function toForm(
  values: Partial<FormState> & { platformId: string },
): FormState {
  return {
    title: values.title ?? "",
    aiLabName: values.aiLabName ?? "",
    description: values.description ?? "",
    affiliateUrl: values.affiliateUrl ?? "",
    currency: values.currency ?? "USD",
    salaryMin: values.salaryMin ?? "",
    salaryMax: values.salaryMax ?? "",
    platformId: values.platformId,
    tags: values.tags ?? "",
    category: values.category ?? "",
    region: values.region ?? "",
    badge: values.badge ?? "",
  };
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function tagsLabel(tags: unknown): string {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

export function OpportunityTable({
  categories = [],
}: {
  categories?: ApiCategory[];
}) {
  const [records, setRecords] = useState<ApiOpportunity[]>([]);
  const [platforms, setPlatforms] = useState<ApiPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiOpportunity | null>(null);
  const [form, setForm] = useState<FormState>(() =>
    toForm({ platformId: "" }),
  );
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setTableError(null);
    try {
      const [opportunitiesResponse, platformsResponse] = await Promise.all([
        fetch("/api/admin/opportunities"),
        fetch("/api/admin/platforms"),
      ]);
      const opportunities: unknown = await opportunitiesResponse.json();
      const platformData: unknown = await platformsResponse.json();

      if (!opportunitiesResponse.ok) {
        setLoadError(
          (opportunities as { error?: string } | null)?.error ??
            "Failed to load opportunities.",
        );
        return;
      }
      if (!platformsResponse.ok) {
        setLoadError(
          (platformData as { error?: string } | null)?.error ??
            "Failed to load platforms.",
        );
        return;
      }

      setRecords(Array.isArray(opportunities) ? (opportunities as ApiOpportunity[]) : []);
      setPlatforms(Array.isArray(platformData) ? (platformData as ApiPlatform[]) : []);
    } catch {
      setLoadError("Network error while loading data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = (field: keyof FormState) => (
    event: FormEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const value = event.currentTarget.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(toForm({ platformId: platforms[0]?.id ?? "" }));
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (record: ApiOpportunity) => {
    setEditing(record);
    setForm(
      toForm({
        title: record.title,
        aiLabName: record.aiLabName,
        description: record.description,
        affiliateUrl: record.affiliateUrl,
        currency: record.currency,
        salaryMin: record.salaryMin?.toString() ?? "",
        salaryMax: record.salaryMax?.toString() ?? "",
        platformId: record.platformId,
        tags: tagsLabel(record.tags),
        category: record.category ?? "",
        region: record.region ?? "",
        badge: record.badge ?? "",
      }),
    );
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
      aiLabName: form.aiLabName.trim(),
      description: form.description,
      affiliateUrl: form.affiliateUrl.trim(),
      currency: form.currency.trim() || "USD",
      salaryMin: form.salaryMin === "" ? null : Number(form.salaryMin),
      salaryMax: form.salaryMax === "" ? null : Number(form.salaryMax),
      platformId: form.platformId,
      tags: parseTags(form.tags),
      category: form.category.trim(),
      region: form.region.trim(),
      badge: form.badge || null,
    };
    if (editing) payload.id = editing.id;

    try {
      const response = await fetch("/api/admin/opportunities", {
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

  const remove = async (record: ApiOpportunity) => {
    if (!window.confirm(`Delete the opportunity "${record.title}"?`)) return;
    setBusy(true);
    setTableError(null);
    try {
      const response = await fetch(
        `/api/admin/opportunities?id=${encodeURIComponent(record.id)}`,
        { method: "DELETE" },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setTableError(
          (data as { error?: string } | null)?.error ??
            "Could not delete opportunity.",
        );
        return;
      }
      await load();
    } catch {
      setTableError("Network error while deleting the opportunity.");
    } finally {
      setBusy(false);
    }
  };

  const salaryLabel = (record: ApiOpportunity) => {
    if (record.salaryMin == null && record.salaryMax == null) return "—";
    const min = record.salaryMin == null ? "" : `${record.salaryMin}`;
    const max = record.salaryMax == null ? "" : `${record.salaryMax}`;
    return `${record.currency} ${min}${min && max ? " – " : ""}${max}`.trim();
  };

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {loading
            ? "Loading…"
            : `${records.length} opportunity${records.length === 1 ? "" : "ies"}`}
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
          Fetching opportunities…
        </p>
      ) : records.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No opportunities yet. Click “Create New” to add one.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Title</th>
                <th className="pb-3 pr-4 font-semibold">Platform</th>
                <th className="pb-3 pr-4 font-semibold">AI lab</th>
                <th className="pb-3 pr-4 font-semibold">Salary</th>
                <th className="pb-3 pr-4 font-semibold">Tags</th>
                <th className="pb-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t border-slate-700/60">
                  <td className="py-3 pr-4 text-white">{record.title}</td>
                  <td className="py-3 pr-4 text-slate-300">
                    {record.platform.name}
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {record.aiLabName || "—"}
                  </td>
                  <td className="py-3 pr-4 text-slate-300">
                    {salaryLabel(record)}
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {tagsLabel(record.tags) || "—"}
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
        title={editing ? `Edit "${editing.title}"` : "Create a new opportunity"}
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
                placeholder="AI Training Data Annotator"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Platform
              <select
                required
                value={form.platformId}
                onChange={setField("platformId")}
                className={inputClass}
              >
                {platforms.length === 0 && <option value="">No platforms yet</option>}
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              AI lab name
              <input
                type="text"
                value={form.aiLabName}
                onChange={setField("aiLabName")}
                placeholder="OpenAI"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Affiliate URL
              <input
                type="url"
                value={form.affiliateUrl}
                onChange={setField("affiliateUrl")}
                placeholder="https://…"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Category
              <select
                value={form.category}
                onChange={setField("category")}
                className={inputClass}
              >
                <option value="">
                  {categories.length === 0
                    ? "No categories available - please add one in the Categories tab."
                    : "Select a category..."}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Region
              <input
                type="text"
                value={form.region}
                onChange={setField("region")}
                placeholder="Remote / Global"
                className={inputClass}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
                Salary min
                <input
                  type="number"
                  value={form.salaryMin}
                  onChange={setField("salaryMin")}
                  placeholder="30000"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
                Salary max
                <input
                  type="number"
                  value={form.salaryMax}
                  onChange={setField("salaryMax")}
                  placeholder="80000"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Currency
              <input
                type="text"
                value={form.currency}
                onChange={setField("currency")}
                placeholder="USD"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300 sm:col-span-2">
              Tags (comma separated)
              <input
                type="text"
                value={form.tags}
                onChange={setField("tags")}
                placeholder="Remote, Full-time, Data"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300 sm:col-span-2">
              Highlight Badge
              <select value={form.badge} onChange={setField("badge")} className={inputClass}>
                <option value="">None</option>
                <option value="New">New</option>
                <option value="Trending">Trending</option>
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">
              Description
            </label>
            <AIAssistantButton
              contextType="opportunity"
              onGenerate={(html) =>
                setForm((prev) => ({ ...prev, description: html }))
              }
            />
            <RichTextEditor
              value={form.description}
              onChange={(html) =>
                setForm((prev) => ({ ...prev, description: html }))
              }
            />
          </div>

          {formError && (
            <p role="alert" className="text-sm text-red-400">
              {formError}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create opportunity"}
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

export default OpportunityTable;