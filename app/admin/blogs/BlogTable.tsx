"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Modal from "../Modal";
import { cardClass, inputClass, primaryBtn, subtleBtn } from "../ui";
import { RichTextEditor } from "../pages/RichTextEditor";
import AIAssistantButton from "@/components/admin/AIAssistantButton";

type ApiPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  featuredImage: string | null;
  metaDescription: string;
  excerpt: string;
  published: boolean;
  publishedAt: string | null;
  authorId: string;
  author: { id: string; email: string; role: string };
  createdAt: string;
  updatedAt: string;
};

type ApiUser = { id: string; email: string; role: string };

type FormState = {
  slug: string;
  title: string;
  content: string;
  featuredImage: string;
  metaDescription: string;
  excerpt: string;
  published: boolean;
  publishedAt: string;
  authorId: string;
};

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toForm(post: Partial<ApiPost> & { authorId: string }): FormState {
  return {
    slug: post.slug ?? "",
    title: post.title ?? "",
    content: post.content ?? "",
    featuredImage: post.featuredImage ?? "",
    metaDescription: post.metaDescription ?? "",
    excerpt: post.excerpt ?? "",
    published: post.published ?? false,
    publishedAt: toLocalInput(post.publishedAt ?? null),
    authorId: post.authorId,
  };
}

function dateLabel(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export function BlogTable() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPost | null>(null);
  const [form, setForm] = useState<FormState>(() => toForm({ authorId: "" }));
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setTableError(null);
    try {
      const [postsResponse, usersResponse] = await Promise.all([
        fetch("/api/admin/blogs"),
        fetch("/api/admin/users"),
      ]);
      const postData: unknown = await postsResponse.json();
      const userData: unknown = await usersResponse.json();

      if (!postsResponse.ok) {
        setLoadError(
          (postData as { error?: string } | null)?.error ?? "Failed to load posts.",
        );
        return;
      }
      if (!usersResponse.ok) {
        setLoadError(
          (userData as { error?: string } | null)?.error ?? "Failed to load authors.",
        );
        return;
      }

      setPosts(Array.isArray(postData) ? (postData as ApiPost[]) : []);
      setUsers(Array.isArray(userData) ? (userData as ApiUser[]) : []);
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
    event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const value: FormState[keyof FormState] =
      field === "published"
        ? (event.currentTarget as HTMLInputElement).checked
        : event.currentTarget.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        featuredImage: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.onerror = () => {
      setForm((prev) => ({ ...prev, featuredImage: "" }));
    };
    reader.readAsDataURL(file);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(toForm({ authorId: users[0]?.id ?? "" }));
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (post: ApiPost) => {
    setEditing(post);
    setForm(
      toForm({
        slug: post.slug,
        title: post.title,
        content: post.content,
        featuredImage: post.featuredImage,
        metaDescription: post.metaDescription,
        excerpt: post.excerpt,
        published: post.published,
        publishedAt: post.publishedAt,
        authorId: post.authorId,
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
      slug: form.slug.trim().toLowerCase(),
      title: form.title.trim(),
      content: form.content,
      featuredImage: form.featuredImage,
      metaDescription: form.metaDescription.trim(),
      excerpt: form.excerpt.trim(),
      published: form.published,
      publishedAt: form.publishedAt
        ? new Date(form.publishedAt).toISOString()
        : null,
      authorId: form.authorId,
    };
    if (editing) payload.id = editing.id;

    try {
      const response = await fetch("/api/admin/blogs", {
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

  const remove = async (post: ApiPost) => {
    if (!window.confirm(`Delete the post "${post.title}"?`)) return;
    setBusy(true);
    setTableError(null);
    try {
      const response = await fetch(
        `/api/admin/blogs?id=${encodeURIComponent(post.id)}`,
        { method: "DELETE" },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setTableError(
          (data as { error?: string } | null)?.error ?? "Could not delete post.",
        );
        return;
      }
      await load();
    } catch {
      setTableError("Network error while deleting the post.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {loading ? "Loading…" : `${posts.length} post${posts.length === 1 ? "" : "s"}`}
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
          Fetching blog posts…
        </p>
      ) : posts.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No blog posts yet. Click “Create New” to write your first post.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4 font-semibold">Title</th>
                <th className="pb-3 pr-4 font-semibold">Author</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Published</th>
                <th className="pb-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t border-slate-700/60">
                  <td className="py-3 pr-4">
                    <p className="text-white">{post.title}</p>
                    <p className="font-mono text-xs text-slate-500">
                      /{post.slug}
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {post.author.email}
                  </td>
                  <td className="py-3 pr-4">
                    {post.published ? (
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-300">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {dateLabel(post.publishedAt)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(post)}
                      className="mr-3 text-sm font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(post)}
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
        title={editing ? `Edit "${editing.title}"` : "Write a new blog post"}
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
                placeholder="How to Get Hired as an AI Annotator"
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
                placeholder="ai-annotator-guide"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Author
              <select
                required
                value={form.authorId}
                onChange={setField("authorId")}
                className={inputClass}
              >
                {users.length === 0 && <option value="">No users yet</option>}
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} ({user.role})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              Publish date
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={setField("publishedAt")}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300 sm:col-span-2">
              Meta description (SEO)
              <input
                type="text"
                maxLength={300}
                value={form.metaDescription}
                onChange={setField("metaDescription")}
                placeholder="A short summary shown in search results…"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300 sm:col-span-2">
              Excerpt
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={setField("excerpt")}
                placeholder="A lead paragraph displayed in blog listings…"
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Featured Image
            {form.featuredImage && (
              <img
                src={form.featuredImage}
                alt="Featured image preview"
                className="h-32 w-full rounded-xl border border-slate-700 bg-slate-900/60 object-cover p-1.5"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleImageUpload(event.target.files?.[0] ?? null)
              }
              className={`${inputClass} file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white`}
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">
              Content
            </label>
            <AIAssistantButton
              contextType="blog"
              placeholder="e.g. Write a blog post about how to land a remote AI training job"
              onGenerate={(html) =>
                setForm((prev) => ({ ...prev, content: html }))
              }
            />
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
            />
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={form.published}
              onChange={setField("published")}
              className="h-4 w-4 accent-blue-600"
            />
            Published
          </label>

          {formError && (
            <p role="alert" className="text-sm text-red-400">
              {formError}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create post"}
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

export default BlogTable;