"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-slate-700";

const primaryBtn =
  "inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtn =
  "inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100";

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

export function RegisterForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [country, setCountry] = useState("Algeria");
  const [skillsText, setSkillsText] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const skills = parseSkills(skillsText);

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
    } catch {
      setError("Could not read the selected file.");
    }
  };

  const validateStep1 = () => {
    if (!fullName.trim()) return "Full name is required.";
    if (!email.includes("@")) return "A valid email is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const validateStep2 = () => {
    if (!country.trim()) return "Country is required.";
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (step === 1) {
      const step1Error = validateStep1();
      if (step1Error) {
        setError(step1Error);
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const step2Error = validateStep2();
      if (step2Error) {
        setError(step2Error);
        return;
      }
      setStep(3);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          headline,
          country,
          skills,
          isPublic,
          ...(photo ? { profilePicture: photo } : {}),
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

      await signIn("credentials", { email, password, redirect: false });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepIndicator = (number: number, label: string) => (
    <li
      className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
        step >= number ? "text-blue-600" : "text-slate-400"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
          step >= number
            ? "bg-blue-600 text-white"
            : "border border-slate-300 text-slate-400"
        }`}
      >
        {number}
      </span>
      {label}
    </li>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <ol className="flex items-center gap-4">
        {stepIndicator(1, "Account")}
        {stepIndicator(2, "Profile")}
        {stepIndicator(3, "Confirm")}
      </ol>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <label className={labelClass}>
            Full name
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Yacine Benali"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Password
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              className={inputClass}
            />
          </label>

          <button type="submit" className={`${primaryBtn} mt-1`}>
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
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

          <label className={labelClass}>
            Professional headline
            <input
              type="text"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="AI DATA TRAINING | DATA ANNOTATION"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Country
            <input
              type="text"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              placeholder="Algeria"
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

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            Show my profile in the Expert Directory
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={secondaryBtn}
            >
              Back
            </button>
            <button type="submit" className={primaryBtn}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <dl className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 font-semibold text-slate-500">
                Name
              </dt>
              <dd className="text-slate-900">{fullName}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 font-semibold text-slate-500">
                Email
              </dt>
              <dd className="text-slate-900">{email}</dd>
            </div>
            {headline && (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 font-semibold text-slate-500">
                  Headline
                </dt>
                <dd className="text-slate-900">{headline}</dd>
              </div>
            )}
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 font-semibold text-slate-500">
                Country
              </dt>
              <dd className="text-slate-900">{country}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 font-semibold text-slate-500">
                Skills
              </dt>
              <dd>
                {skills.length === 0 ? (
                  <span className="text-slate-500">None</span>
                ) : (
                  <span className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </span>
                )}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 font-semibold text-slate-500">
                Directory
              </dt>
              <dd className="text-slate-900">
                {isPublic
                  ? "Visible in Expert Directory"
                  : "Hidden from Expert Directory"}
              </dd>
            </div>
          </dl>

          <p className="text-sm text-slate-500">
            Your password is hashed with bcrypt and stored securely. Click
            &ldquo;Create account&rdquo; to finish.
          </p>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={loading}
              className={secondaryBtn}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${primaryBtn} flex-1`}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </div>
        </div>
      )}

      {step !== 3 && error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

export default RegisterForm;