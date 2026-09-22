"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DashboardSidebar from "../DashboardSidebar";

type ProfileFormData = {
  fullName: string;
  headline: string;
  country: string;
  stateRegion: string;
  bio: string;
  areasOfExpertise: string;
  languages: string;
  yearsOfExperience: string;
  availability: string;
  workPreference: string;
  hourlyRate: string;
  education: string;
  certifications: string;
  linkedin: string;
  xUrl: string;
  github: string;
  youtube: string;
  website: string;
  phoneNumber: string;
  isPublic: boolean;
  showEmail: boolean;
  showPhone: boolean;
  emailUpdates: boolean;
};

const defaultForm: ProfileFormData = {
  fullName: "",
  headline: "",
  country: "",
  stateRegion: "",
  bio: "",
  areasOfExpertise: "",
  languages: "",
  yearsOfExperience: "",
  availability: "",
  workPreference: "",
  hourlyRate: "",
  education: "",
  certifications: "",
  linkedin: "",
  xUrl: "",
  github: "",
  youtube: "",
  website: "",
  phoneNumber: "",
  isPublic: false,
  showEmail: false,
  showPhone: false,
  emailUpdates: true,
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-slate-700";

const checkboxClass =
  "flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700";

const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const headerClass =
  "text-base font-bold tracking-tight text-slate-900 border-b border-slate-100 pb-4";

function parseSkills(value: string): string[] {
  return value
    .split(/[,]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

const yearsOptions = [
  "",
  "Less than 1 year",
  "1 - 3 years",
  "3 - 5 years",
  "5 - 10 years",
  "10+ years",
];

const availabilityOptions = [
  "",
  "Full-time",
  "Part-time",
  "Freelance / Contract",
  "Open to opportunities",
];

const workPreferenceOptions = ["", "Remote", "On-site", "Hybrid"];

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<ProfileFormData>(defaultForm);
  const [skillsText, setSkillsText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login?callbackUrl=/dashboard/edit");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const response = await fetch("/api/expert/profile");
        const data: unknown = await response.json();

        if (!response.ok) {
          throw new Error("Could not load your profile.");
        }

        const { profile, email: profileEmail } = (data ?? {}) as {
          profile?: (Partial<ProfileFormData> & {
            profilePicture?: string | null;
            skills?: unknown;
          }) | null;
          email?: string | null;
        };

        if (cancelled) return;

        setForm({
          ...defaultForm,
          ...(profile ?? {}),
        });
        const skills = Array.isArray(profile?.skills)
          ? profile.skills.filter((s): s is string => typeof s === "string")
          : [];
        setSkillsText(skills.join(", "));
        setPhoto(profile?.profilePicture ?? null);
        setEmail(profileEmail ?? session.user.email ?? "");
      } catch {
        if (!cancelled) setLoadError("Could not load your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session, router, attempt]);

  const update = <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectPhoto = async (event: FormEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Please choose an image smaller than 1MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setPhoto(dataUrl);
      setError(null);
      setSaved(false);
    } catch {
      setError("Could not read the selected file.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/expert/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          skills: parseSkills(skillsText),
          profilePicture: photo,
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        setError(
          (data as { error?: string } | null)?.error ??
            "Something went wrong. Please try again.",
        );
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const retryLoad = useCallback(() => setAttempt((a) => a + 1), []);

  return (
    <div className="flex flex-col gap-6 py-8 lg:flex-row lg:gap-8">
      <DashboardSidebar />

      <div className="min-w-0 flex-1">
        {loading ? (
          <div className="animate-pulse rounded-card bg-slate-800 p-8">
            <p className="text-sm text-slate-400">Loading your profile…</p>
          </div>
        ) : loadError ? (
          <div className="rounded-card border border-white/10 bg-slate-800 p-8 text-center">
            <p className="text-sm text-slate-300">{loadError}</p>
            <button
              type="button"
              onClick={retryLoad}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Retry
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-8"
            noValidate
          >
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-white p-6 shadow-2xl sm:p-8">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Edit Profile
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Keep your details up to date so AI labs and platforms can
                  find you.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {saving && <p className="text-sm text-slate-500">Saving…</p>}
                {saved && (
                  <p
                    role="status"
                    className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700"
                  >
                    Saved
                  </p>
                )}
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </p>
            )}

            <section className="rounded-card bg-white p-6 shadow-2xl sm:p-8">
              <h2 className={headerClass}>Basic Profile</h2>
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt="Profile preview"
                      className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-slate-300 text-xs font-semibold text-slate-400">
                      Photo
                    </span>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      Upload Photo
                    </button>
                    {photo && (
                      <button
                        type="button"
                        onClick={() => setPhoto(null)}
                        className="text-xs font-semibold text-red-500 hover:text-red-600"
                      >
                        Remove photo
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void selectPhoto(event)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    Full Name *
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(event) => update("fullName", event.target.value)}
                      placeholder="Yacine Benali"
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Email
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className={`${inputClass} bg-slate-100 text-slate-500`}
                    />
                  </label>
                </div>

                <label className={labelClass}>
                  Professional Headline
                  <input
                    type="text"
                    value={form.headline}
                    onChange={(event) => update("headline", event.target.value)}
                    placeholder="AI DATA TRAINING | DATA ANNOTATION"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Bio
                  <textarea
                    rows={4}
                    value={form.bio}
                    onChange={(event) => update("bio", event.target.value)}
                    placeholder="Tell labs about your experience, specialties, and what you are looking for."
                    className={inputClass}
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    Country
                    <input
                      type="text"
                      value={form.country}
                      onChange={(event) => update("country", event.target.value)}
                      placeholder="Algeria"
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    State / Region
                    <input
                      type="text"
                      value={form.stateRegion}
                      onChange={(event) =>
                        update("stateRegion", event.target.value)
                      }
                      placeholder="Algiers"
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-card bg-white p-6 shadow-2xl sm:p-8">
              <h2 className={headerClass}>Professional Expertise</h2>
              <div className="mt-6 flex flex-col gap-4">
                <label className={labelClass}>
                  Areas of Expertise
                  <input
                    type="text"
                    value={form.areasOfExpertise}
                    onChange={(event) =>
                      update("areasOfExpertise", event.target.value)
                    }
                    placeholder="Data annotation, evaluation, prompt engineering"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Skills
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(event) => setSkillsText(event.target.value)}
                    placeholder="python, LLMs, data annotation"
                    className={inputClass}
                  />
                  <span className="text-xs text-slate-500">
                    Separate tags with commas.
                  </span>
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    Languages
                    <input
                      type="text"
                      value={form.languages}
                      onChange={(event) => update("languages", event.target.value)}
                      placeholder="English, French, Arabic"
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Years of Experience
                    <select
                      value={form.yearsOfExperience}
                      onChange={(event) =>
                        update("yearsOfExperience", event.target.value)
                      }
                      className={selectClass}
                    >
                      {yearsOptions.map((option) => (
                        <option key={option} value={option}>
                          {option || "Select…"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-card bg-white p-6 shadow-2xl sm:p-8">
              <h2 className={headerClass}>Work Preferences</h2>
              <div className="mt-6 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label className={labelClass}>
                    Availability
                    <select
                      value={form.availability}
                      onChange={(event) =>
                        update("availability", event.target.value)
                      }
                      className={selectClass}
                    >
                      {availabilityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option || "Select…"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={labelClass}>
                    Work Preference
                    <select
                      value={form.workPreference}
                      onChange={(event) =>
                        update("workPreference", event.target.value)
                      }
                      className={selectClass}
                    >
                      {workPreferenceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option || "Select…"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={labelClass}>
                    Hourly Rate
                    <input
                      type="text"
                      value={form.hourlyRate}
                      onChange={(event) => update("hourlyRate", event.target.value)}
                      placeholder="$0.00 / hr"
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-card bg-white p-6 shadow-2xl sm:p-8">
              <h2 className={headerClass}>Education &amp; Qualifications</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Education
                  <textarea
                    rows={4}
                    value={form.education}
                    onChange={(event) => update("education", event.target.value)}
                    placeholder="Degree, institution, year"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Certifications
                  <textarea
                    rows={4}
                    value={form.certifications}
                    onChange={(event) =>
                      update("certifications", event.target.value)
                    }
                    placeholder="Relevant certifications or training"
                    className={inputClass}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-card bg-white p-6 shadow-2xl sm:p-8">
              <h2 className={headerClass}>Professional &amp; Social Links</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  LinkedIn
                  <input
                    type="text"
                    value={form.linkedin}
                    onChange={(event) => update("linkedin", event.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  X
                  <input
                    type="text"
                    value={form.xUrl}
                    onChange={(event) => update("xUrl", event.target.value)}
                    placeholder="https://x.com/username"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  GitHub
                  <input
                    type="text"
                    value={form.github}
                    onChange={(event) => update("github", event.target.value)}
                    placeholder="https://github.com/username"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  YouTube
                  <input
                    type="text"
                    value={form.youtube}
                    onChange={(event) => update("youtube", event.target.value)}
                    placeholder="https://youtube.com/@channel"
                    className={inputClass}
                  />
                </label>

                <label className={`${labelClass} sm:col-span-2`}>
                  Website
                  <input
                    type="text"
                    value={form.website}
                    onChange={(event) => update("website", event.target.value)}
                    placeholder="https://example.com"
                    className={inputClass}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-card bg-white p-6 shadow-2xl sm:p-8">
              <h2 className={headerClass}>Contact &amp; Privacy</h2>
              <div className="mt-6 flex flex-col gap-4">
                <label className={`${labelClass} sm:w-1/2`}>
                  Phone Number
                  <input
                    type="text"
                    value={form.phoneNumber}
                    onChange={(event) => update("phoneNumber", event.target.value)}
                    placeholder="+213 5 55 12 34 56"
                    className={inputClass}
                  />
                </label>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Visibility
                </p>

                <label className={checkboxClass}>
                  <input
                    type="checkbox"
                    checked={form.showEmail}
                    onChange={(event) => update("showEmail", event.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  Show my email on my public profile
                </label>

                <label className={checkboxClass}>
                  <input
                    type="checkbox"
                    checked={form.showPhone}
                    onChange={(event) => update("showPhone", event.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  Show my phone number on my public profile
                </label>

                <label className={checkboxClass}>
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(event) => update("isPublic", event.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  Show my profile in the Expert Directory
                </label>

                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email Preferences
                </p>

                <label className={checkboxClass}>
                  <input
                    type="checkbox"
                    checked={form.emailUpdates}
                    onChange={(event) =>
                      update("emailUpdates", event.target.checked)
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                  Send me updates about new AI opportunities
                </label>
              </div>
            </section>

            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}