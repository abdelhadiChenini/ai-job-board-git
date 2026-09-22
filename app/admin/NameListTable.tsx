"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Modal from "./Modal";
import { cardClass, inputClass, primaryBtn, subtleBtn } from "./ui";

type ApiRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type NameListTableProps = {
  endpoint: string;
  singular: string;
  plural: string;
  emptyText: string;
};

export function NameListTable({
  endpoint,
  singular,
  plural,
  emptyText,
}: NameListTableProps) {
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setTableError(null);
    try {
      const response = await fetch(endpoint);
      const data: unknown = await response.json();
      if (!response.ok) {
        setLoadError(
          (data as { error?: string } | null)?.error ??
            `Failed to load ${plural.toLowerCase()}.`,
        );
        return;
      }
      setRecords(Array.isArray(data) ? (data as ApiRecord[]) : []);
    } catch {
      setLoadError(`Network error while loading ${plural.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [endpoint, plural]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setName("");
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
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

  const remove = async (record: ApiRecord) => {
    if (!window.confirm(`Delete the ${singular.toLowerCase()} "${record.name}"?`)) return;
    setBusy(true);
    setTableError(null);
    try {
      const response = await fetch(
        `${endpoint}?id=${encodeURIComponent(record.id)}`,
        { method: "DELETE" },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setTableError(
          (data as { error?: string } | null)?.error ??
            `Could not delete ${singular.toLowerCase()}.`,
        );
        return;
      }
      await load();
    } catch {
      setTableError(`Network error while deleting the ${singular.toLowerCase()}.`);
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
            : `${records.length} ${records.length === 1 ? singular.toLowerCase() : plural.toLowerCase()}`}
        </p>
        <button type="button" onClick={openCreate} className={primaryBtn}>
          + Add New
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
          Fetching {plural.toLowerCase()}…
        </p>
      ) : records.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Name</th>
                <th className="pb-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t border-slate-700/60">
                  <td className="py-3 pr-4 text-white">{record.name}</td>
                  <td className="py-3 text-right">
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
        title={`Add ${singular.toLowerCase()}`}
        onClose={closeModal}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Name
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={`Enter ${singular.toLowerCase()} name…`}
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
              {busy ? "Saving…" : `Add ${singular.toLowerCase()}`}
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