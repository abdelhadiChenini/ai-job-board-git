"use client";

import { FormEvent, useEffect, useState } from "react";

type SeoFormData = {
  siteTitle: string;
  metaDescription: string;
  keywords: string;
  logoUrl: string;
  headerInjection: string;
  bodyInjection: string;
  footerInjection: string;
};

const defaultForm: SeoFormData = {
  siteTitle: "",
  metaDescription: "",
  keywords: "",
  logoUrl: "",
  headerInjection: "",
  bodyInjection: "",
  footerInjection: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-slate-300";

const cardClass = "rounded-card border border-white/10 bg-slate-800 p-6 sm:p-8";

const saveButtonClass =
  "inline-flex w-fit items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass =
  "inline-flex w-fit items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-blue-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

export default function AdminSeoPage() {
  const [form, setForm] = useState<SeoFormData>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerated, setRegenerated] = useState(false);

  const update = (key: keyof SeoFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/admin/seo");
        const data: unknown = await response.json();

        if (!response.ok) {
          throw new Error("Could not load SEO settings.");
        }

        const settings = (data ?? {}) as Partial<SeoFormData>;
        if (cancelled) return;

        setForm({
          siteTitle: settings.siteTitle ?? "",
          metaDescription: settings.metaDescription ?? "",
          keywords: settings.keywords ?? "",
          logoUrl: settings.logoUrl ?? "",
          headerInjection: settings.headerInjection ?? "",
          bodyInjection: settings.bodyInjection ?? "",
          footerInjection: settings.footerInjection ?? "",
        });
      } catch {
        if (!cancelled) setLoadError("Could not load SEO settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const response = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        setError(
          (data as { error?: string } | null)?.error ??
            "Could not save your changes.",
        );
        return;
      }

      setSaved(true);
    } catch {
      setError("Could not save your changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerated(false);
    setError(null);
    setRegenerating(true);

    try {
      const response = await fetch("/api/admin/seo/sitemap", {
        method: "POST",
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        setError(
          (data as { error?: string } | null)?.error ??
            "Could not regenerate the sitemap.",
        );
        return;
      }

      setRegenerated(true);
    } catch {
      setError("Could not regenerate the sitemap.");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">SEO</h1>
        <p className="text-sm text-slate-400">
          Global search metadata, brand assets and code injections applied
          across the entire site.
        </p>
      </header>

      {saved && (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
        >
          SEO settings saved.
        </p>
      )}

      {regenerated && (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
        >
          Sitemap regenerated.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className={`${cardClass} animate-pulse`}>
          <p className="text-sm text-slate-400">Loading SEO settings…</p>
        </div>
      ) : loadError ? (
        <div className={`${cardClass} text-center`}>
          <p className="text-sm text-slate-300">{loadError}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className={cardClass}>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Meta &amp; Branding
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Search-engine metadata, keywords and your site logo.
            </p>

            <div className="mt-6 flex flex-col gap-4">
              <label className={labelClass}>
                Site meta title
                <input
                  type="text"
                  value={form.siteTitle}
                  onChange={(event) => update("siteTitle", event.target.value)}
                  maxLength={120}
                  placeholder="AI Job Board"
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Meta description
                <textarea
                  rows={3}
                  value={form.metaDescription}
                  onChange={(event) =>
                    update("metaDescription", event.target.value)
                  }
                  placeholder="Curated job listings from the world's leading AI labs and platforms."
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Keywords
                <input
                  type="text"
                  value={form.keywords}
                  onChange={(event) => update("keywords", event.target.value)}
                  placeholder="AI jobs, remote AI work, data annotation, prompt engineering"
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Logo URL
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(event) => update("logoUrl", event.target.value)}
                  placeholder="https://example.com/logo.png"
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Code Injections
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Raw HTML/JS injected into the{" "}
              <code className="text-slate-300">&lt;head&gt;</code>, top of{" "}
              <code className="text-slate-300">&lt;body&gt;</code> and before{" "}
              <code className="text-slate-300">&lt;/body&gt;</code> on every
              page.
            </p>

            <div className="mt-6 flex flex-col gap-4">
              <label className={labelClass}>
                Header injection
                <textarea
                  rows={4}
                  value={form.headerInjection}
                  onChange={(event) =>
                    update("headerInjection", event.target.value)
                  }
                  placeholder='<script async src="https://example.com/analytics.js"></script>'
                  className={`${inputClass} font-mono`}
                />
              </label>

              <label className={labelClass}>
                Body injection
                <textarea
                  rows={3}
                  value={form.bodyInjection}
                  onChange={(event) =>
                    update("bodyInjection", event.target.value)
                  }
                  placeholder='<div id="support-widget"></div>'
                  className={`${inputClass} font-mono`}
                />
              </label>

              <label className={labelClass}>
                Footer injection
                <textarea
                  rows={3}
                  value={form.footerInjection}
                  onChange={(event) =>
                    update("footerInjection", event.target.value)
                  }
                  placeholder="<script>console.log('footer')</script>"
                  className={`${inputClass} font-mono`}
                />
              </label>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={saving} className={saveButtonClass}>
              {saving ? "Saving…" : "Save SEO settings"}
            </button>
            <button
              type="button"
              onClick={() => void handleRegenerate()}
              disabled={regenerating}
              className={secondaryButtonClass}
            >
              {regenerating ? "Regenerating…" : "Regenerate sitemap"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}