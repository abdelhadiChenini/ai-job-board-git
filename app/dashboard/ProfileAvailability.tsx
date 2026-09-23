"use client";

import { FormEvent, useState } from "react";
import { PREDEFINED_SKILLS } from "@/lib/constants";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-slate-700";

type ProfileState = {
  hourlyRate: string;
  skills: string[];
  bio: string;
  availability: string;
};

export function ProfileAvailability({
  initialProfile,
}: {
  initialProfile: ProfileState;
}) {
  const [form, setForm] = useState<ProfileState>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const update = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSkill = (skill: string) =>
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((item) => item !== skill)
        : [...prev.skills, skill],
    }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSaved(false);
    setSaving(true);

    try {
      const response = await fetch("/api/experts/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hourlyRate: form.hourlyRate,
          skills: form.skills,
          bio: form.bio,
          availability: form.availability,
        }),
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setFormError(
          (data as { error?: string } | null)?.error ??
            "Something went wrong. Please try again.",
        );
        return;
      }

      setSaved(true);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-card border border-white/10 bg-slate-800 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold tracking-tight text-white">
          Profile &amp; Availability
        </h2>
        {saved && (
          <p
            role="status"
            className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-400"
          >
            Saved
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-5">
          {formError && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400"
            >
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Hourly Rate
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.hourlyRate}
                    onChange={(event) =>
                      update("hourlyRate", event.target.value)
                    }
                    placeholder="e.g. 25"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Primary Skills
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_SKILLS.map((skill) => {
                      const isActive = form.skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          aria-pressed={isActive}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            isActive
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs text-slate-500">
                    Select the skills you offer.
                  </span>
                </label>
              </div>

              <label className={labelClass}>
                Bio
                <textarea
                  rows={4}
                  value={form.bio}
                  onChange={(event) => update("bio", event.target.value)}
                  placeholder="Tell AI labs about your experience and specialities."
                  className={`${inputClass} resize-y`}
                />
              </label>
            </div>

            <div className="flex flex-col gap-4 lg:border-l lg:border-white/10 lg:pl-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Availability
              </p>

              <button
                type="button"
                role="switch"
                aria-checked={form.availability === "Available for Work"}
                onClick={() =>
                  update(
                    "availability",
                    form.availability === "Available for Work"
                      ? "Not Looking"
                      : "Available for Work",
                  )
                }
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  form.availability === "Available for Work"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-600 bg-slate-900/40 text-slate-300"
                }`}
              >
                <span>
                  {form.availability === "Available for Work"
                    ? "Available for Work"
                    : "Not Looking"}
                </span>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    form.availability === "Available for Work"
                      ? "bg-emerald-500"
                      : "bg-slate-600"
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      form.availability === "Available for Work"
                        ? "left-[22px]"
                        : "left-0.5"
                    }`}
                  />
                </span>
              </button>

              <p className="text-xs text-slate-500">
                Let AI labs know whether you&rsquo;re open to new work.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
    </section>
  );
}

export default ProfileAvailability;