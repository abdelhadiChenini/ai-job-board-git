"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Check, Minus, Star } from "lucide-react";
import Modal from "../Modal";
import {
  updateExpertStatus,
  setFeatured,
  setUserPlan,
  sendManualPasswordReset,
} from "./actions";
import { cardClass, inputClass, primaryBtn, subtleBtn } from "../ui";
import type { Plan } from "@/lib/subscription";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

type ProfileStatus = "all" | "completed" | "incomplete";

type Toast = {
  id: number;
  tone: "success" | "error";
  message: string;
};

const toastTone = {
  success: "border-emerald-500/40 bg-emerald-950/90 text-emerald-200",
  error: "border-red-500/40 bg-red-950/90 text-red-200",
} as const;

/** The reset link handed back by the server action, ready to be copied. */
type ResetLink = {
  email: string;
  url: string;
  expiresAt: string;
};

const PROFILE_STATUS_OPTIONS: { value: ProfileStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Profile Completed" },
  { value: "incomplete", label: "Profile Incomplete" },
];

type ApiUser = {
  id: string;
  email: string;
  role: string;
  plan: Plan;
  isFeatured: boolean;
  paypalSubscriptionId: string | null;
  verificationStatus: VerificationStatus | null;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = { email: string; password: string; role: string };

const emptyForm: FormState = { email: "", password: "", role: "EXPERT" };

const PAGE_SIZE = 20;

type UsersResponse = {
  users: ApiUser[];
  totalCount: number;
  page: number;
  limit: number;
};

function pageItems(current: number, total: number): (number | "gap")[] {
  const wanted = [1, current - 1, current, current + 1, total]
    .filter((page) => page >= 1 && page <= total)
    .filter((page, index, all) => all.indexOf(page) === index)
    .sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  let previous = 0;
  for (const page of wanted) {
    if (page - previous > 1) items.push("gap");
    items.push(page);
    previous = page;
  }
  return items;
}

export function UserTable() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [resetBusyId, setResetBusyId] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<ResetLink | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const nextToastId = useRef(0);

  const pushToast = useCallback((tone: Toast["tone"], text: string) => {
    const id = nextToastId.current++;
    setToasts((current) => [...current, { id, tone, message: text }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 6000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setTableError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (profileStatus !== "all") params.set("profileStatus", profileStatus);
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data: unknown = await response.json();
      if (!response.ok) {
        setLoadError(
          (data as { error?: string } | null)?.error ?? "Failed to load users.",
        );
        return;
      }
      const payload = data as UsersResponse;
      const nextUsers = Array.isArray(payload?.users) ? payload.users : [];
      const nextTotal = Number(payload?.totalCount) || 0;

      // The last row may have been deleted (or the total shrank) — snap back
      // to the highest valid page instead of showing an empty table.
      const maxPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
        return;
      }

      setUsers(nextUsers);
      setTotalCount(nextTotal);
    } catch {
      setLoadError("Network error while loading users.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, profileStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeProfileStatus = (status: ProfileStatus) => {
    if (status === profileStatus) return;
    setProfileStatus(status);
    setCurrentPage(1);
  };

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

  const profileBadge = (user: ApiUser) =>
    user.profileComplete ? (
      <span
        title="Profile complete"
        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400"
      >
        <Check aria-hidden="true" className="h-3.5 w-3.5" />
        Complete
      </span>
    ) : (
      <span
        title="Profile incomplete"
        className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-400"
      >
        <Minus aria-hidden="true" className="h-3.5 w-3.5" />
        Incomplete
      </span>
    );

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

  const changePlan = async (user: ApiUser, plan: Plan) => {
    const previous = user.plan;
    if (plan === previous) return;

    setBusy(true);
    setTableError(null);

    // Optimistic so the badge reacts instantly; `load()` reconciles on success
    // and both failure paths roll back.
    setUsers((prev) =>
      prev.map((row) => (row.id === user.id ? { ...row, plan } : row)),
    );

    try {
      const result = await setUserPlan(user.id, plan);
      if (result && !result.ok) {
        setTableError(result.error ?? "Could not update the plan.");
        await load();
        return;
      }
      await load();
    } catch {
      setTableError("Network error while updating the plan.");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const toggleFeatured = async (user: ApiUser) => {
    const next = !user.isFeatured;
    setBusy(true);
    setTableError(null);

    // Optimistic so the toggle reacts instantly; `load()` reconciles on success
    // and the catch rolls back.
    setUsers((prev) =>
      prev.map((row) =>
        row.id === user.id ? { ...row, isFeatured: next } : row,
      ),
    );

    try {
      const result = await setFeatured(user.id, next);
      if (result && !result.ok) {
        setTableError(result.error ?? "Could not update the featured status.");
        await load();
        return;
      }
      await load();
    } catch {
      setTableError("Network error while updating the featured status.");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const sendResetLink = async (user: ApiUser) => {
    if (
      !window.confirm(
        `Send a password reset link to ${user.email}? Any earlier reset link for this account will stop working.`,
      )
    ) {
      return;
    }

    setResetBusyId(user.id);
    setTableError(null);
    setResetLink(null);
    setLinkCopied(false);

    try {
      const result = await sendManualPasswordReset({ userId: user.id });

      if (!result?.ok) {
        const message = result?.error ?? "Could not send the reset link.";
        setTableError(message);
        pushToast("error", message);
        return;
      }

      setResetLink({
        email: result.email ?? user.email,
        url: result.resetUrl ?? "",
        expiresAt: result.expiresAt ?? "",
      });
      pushToast(
        "success",
        `Reset link generated and emailed to ${result.email ?? user.email}.`,
      );
    } catch {
      const message = "Network error while sending the reset link.";
      setTableError(message);
      pushToast("error", message);
    } finally {
      setResetBusyId(null);
    }
  };

  const closeResetModal = () => {
    setResetLink(null);
    setLinkCopied(false);
  };

  const copyResetLink = async () => {
    if (!resetLink?.url) return;

    try {
      await navigator.clipboard.writeText(resetLink.url);
      setLinkCopied(true);
    } catch {
      // Clipboard access needs a secure context; the link is still on screen
      // and selectable, so the admin can copy it by hand.
      setLinkCopied(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || busy) return;
    setCurrentPage(page);
  };

  return (
    <section className={cardClass}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {loading
            ? "Loading…"
            : `${totalCount} account${totalCount === 1 ? "" : "s"}`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Filter by profile status"
            className="inline-flex rounded-full border border-slate-700 p-1"
          >
            {PROFILE_STATUS_OPTIONS.map((option) => {
              const active = profileStatus === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => changeProfileStatus(option.value)}
                  disabled={busy}
                  aria-pressed={active}
                  className={
                    active
                      ? "rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      : "rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white disabled:opacity-60"
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={openCreate} className={primaryBtn}>
            + Create New
          </button>
        </div>
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
          {profileStatus === "all"
            ? "No users yet. Click “Create New” to add your first account."
            : "No users match this profile status filter."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Email</th>
                <th className="pb-3 pr-4 font-semibold">Profile</th>
                <th className="pb-3 pr-4 font-semibold">Plan</th>
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
                  <td className="py-3 pr-4">{profileBadge(user)}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-col items-start gap-1">
                      <select
                        aria-label={`Subscription plan for ${user.email}`}
                        value={user.plan}
                        disabled={busy}
                        onChange={(event) =>
                          void changePlan(
                            user,
                            event.currentTarget.value as Plan,
                          )
                        }
                        className={
                          user.plan === "PRO"
                            ? "rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300 focus:outline-none disabled:opacity-60"
                            : "rounded-full border border-slate-700 bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-400 focus:outline-none disabled:opacity-60"
                        }
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                      </select>
                      {user.paypalSubscriptionId && (
                        <span
                          title={user.paypalSubscriptionId}
                          className="max-w-[13rem] truncate font-mono text-[11px] text-slate-500"
                        >
                          {user.paypalSubscriptionId}
                        </span>
                      )}
                    </div>
                  </td>
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
                      onClick={() => void toggleFeatured(user)}
                      disabled={busy}
                      aria-pressed={user.isFeatured}
                      title={
                        user.isFeatured
                          ? "Remove the Pro badge from the expert directory"
                          : "Show this expert as featured in the directory"
                      }
                      className={
                        user.isFeatured
                          ? "mr-3 inline-flex items-center gap-1 align-middle text-sm font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-60"
                          : "mr-3 inline-flex items-center gap-1 align-middle text-sm font-semibold text-slate-500 hover:text-amber-300 disabled:opacity-60"
                      }
                    >
                      <Star
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                        fill={user.isFeatured ? "currentColor" : "none"}
                      />
                      {user.isFeatured ? "Featured" : "Feature"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(user)}
                      className="mr-3 text-sm font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendResetLink(user)}
                      disabled={busy || resetBusyId === user.id}
                      title={`Send a password reset link to ${user.email}`}
                      className="mr-3 whitespace-nowrap text-sm font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-60"
                    >
                      {resetBusyId === user.id ? "Sending…" : "Send Reset Link"}
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

      {!loading && !loadError && totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || busy}
              className={subtleBtn}
            >
              Previous
            </button>
            {pageItems(currentPage, totalPages).map((item, index) =>
              item === "gap" ? (
                <span key={`gap-${index}`} className="px-1 text-sm text-slate-500">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item)}
                  disabled={busy || item === currentPage}
                  aria-current={item === currentPage ? "page" : undefined}
                  className={
                    item === currentPage
                      ? "inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white"
                      : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white disabled:opacity-60"
                  }
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || busy}
              className={subtleBtn}
            >
              Next
            </button>
          </div>
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

      <Modal
        open={resetLink !== null}
        title="Password reset link"
        onClose={closeResetModal}
      >
        <p className="text-sm text-slate-400">
          The reset link was emailed to{" "}
          <span className="font-semibold text-slate-200">
            {resetLink?.email}
          </span>
          . Copy it below if the user needs it handed over directly.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Reset link
            <input
              readOnly
              value={resetLink?.url ?? ""}
              onFocus={(event) => event.currentTarget.select()}
              className={`${inputClass} font-mono text-xs`}
            />
          </label>

          {resetLink?.expiresAt && (
            <p className="text-xs text-slate-500">
              Expires at{" "}
              {new Date(resetLink.expiresAt).toLocaleString()} and can only be
              used once.
            </p>
          )}

          <p className="text-xs text-slate-500">
            Anyone holding this link can set the password, so share it with the
            account owner only.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void copyResetLink()}
              disabled={!resetLink?.url}
              className={primaryBtn}
            >
              {linkCopied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={closeResetModal}
              className={subtleBtn}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg shadow-black/40 ${toastTone[toast.tone]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </section>
  );
}

export default UserTable;