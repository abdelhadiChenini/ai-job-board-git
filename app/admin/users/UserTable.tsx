"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Modal from "../Modal";
import { updateExpertStatus } from "./actions";
import { cardClass, inputClass, primaryBtn, subtleBtn } from "../ui";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

type ApiUser = {
  id: string;
  email: string;
  role: string;
  verificationStatus: VerificationStatus | null;
  createdAt: string;
  updatedAt: string;
};

type FormState = { email: string; password: string; role: string };

const emptyForm: FormState = { email: "", password: "", role: "EXPERT" };

export function UserTable() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setTableError(null);
    try {
      const response = await fetch("/api/admin/users");
      const data: unknown = await response.json();
      if (!response.ok) {
        setLoadError(
          (data as { error?: string } | null)?.error ?? "Failed to load users.",
        );
        return;
      }
      setUsers(Array.isArray(data) ? (data as ApiUser[]) : []);
    } catch {
      setLoadError("Network error while loading users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = (field: keyof FormState) => (
    event: FormEvent<HTMLInputElement | HTMLSelectElement>,
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

  const openEdit = (user: ApiUser) => {
    setEditing(user);
    setForm({ email: user.email, password: "", role: user.role });
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
      email: form.email.trim(),
      role: form.role,
    };
    if (form.password) payload.password = form.password;
    if (editing) payload.id = editing.id;

    try {
      const response = await fetch("/api/admin/users", {
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

  const remove = async (user: ApiUser) => {
    if (!window.confirm(`Delete the account for ${user.email}?`)) return;
    setBusy(true);
    setTableError(null);
    try {
      const response = await fetch(
        `/api/admin/users?id=${encodeURIComponent(user.id)}`,
        { method: "DELETE" },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setTableError(
          (data as { error?: string } | null)?.error ?? "Could not delete user.",
        );
        return;
      }
      await load();
    } catch {
      setTableError("Network error while deleting the user.");
    } finally {
      setBusy(false);
    }
  };

  const roleBadge = (role: string) =>
    role === "ADMIN"
      ? "rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400"
      : "rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-300";

  const statusBadge = (user: ApiUser) => {
    if (user.verificationStatus === "APPROVED") {
      return (
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          Approved
        </span>
      );
    }
    if (user.verificationStatus === "REJECTED") {
      return (
        <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400">
          Rejected
        </span>
      );
    }
    if (user.verificationStatus === "PENDING") {
      return (
        <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400">
          Pending
        </span>
      );
    }
    return <span className="text-xs text-slate-500">—</span>;
  };

  const setVerification = async (
    user: ApiUser,
    status: "APPROVED" | "REJECTED",
  ) => {
    setBusy(true);
    setTableError(null);
    try {
      const result = await updateExpertStatus(user.id, status);
      if (result && !result.ok) {
        setTableError(
          result.error ??
            `Could not mark the expert as ${status.toLowerCase()}.`,
        );
        return;
      }
      await load();
    } catch {
      setTableError("Network error while updating the verification status.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {loading ? "Loading…" : `${users.length} account${users.length === 1 ? "" : "s"}`}
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
          Fetching users…
        </p>
      ) : users.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No users yet. Click “Create New” to add your first account.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Email</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Role</th>
                <th className="pb-3 pr-4 font-semibold">Created</th>
                <th className="pb-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-700/60">
                  <td className="py-3 pr-4 text-white">{user.email}</td>
                  <td className="py-3 pr-4">{statusBadge(user)}</td>
                  <td className="py-3 pr-4">
                    <span className={roleBadge(user.role)}>{user.role}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    {user.verificationStatus && (
                      <span className="mr-3 inline-flex items-center gap-2 align-middle">
                        {user.verificationStatus !== "APPROVED" && (
                          <button
                            type="button"
                            onClick={() =>
                              void setVerification(user, "APPROVED")
                            }
                            disabled={busy}
                            className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-60"
                          >
                            Approve
                          </button>
                        )}
                        {user.verificationStatus !== "REJECTED" && (
                          <button
                            type="button"
                            onClick={() =>
                              void setVerification(user, "REJECTED")
                            }
                            disabled={busy}
                            className="text-sm font-semibold text-orange-400 hover:text-orange-300 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        )}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(user)}
                      className="mr-3 text-sm font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(user)}
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
        title={editing ? `Edit ${editing.email}` : "Create a new user"}
        onClose={closeModal}
      >
        <p className="text-sm text-slate-400">
          {editing
            ? "Leave the password blank to keep the current one."
            : "Passwords are stored hashed with bcrypt."}
        </p>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={setField("email")}
              placeholder="name@example.com"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Password
            <input
              type="password"
              value={form.password}
              onChange={setField("password")}
              minLength={editing ? undefined : 8}
              placeholder={
                editing ? "Leave blank to keep current" : "At least 8 characters"
              }
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Role
            <select value={form.role} onChange={setField("role")} className={inputClass}>
              <option value="EXPERT">Expert</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          {formError && (
            <p role="alert" className="text-sm text-red-400">
              {formError}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create user"}
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

export default UserTable;