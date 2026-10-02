"use client";

import { useRef, useState } from "react";
import { Download, FileText, Loader2, Sparkles } from "lucide-react";
import type { CvDocument } from "@/lib/cv";
import { CV_MIN_RAW_EXPERIENCE } from "@/lib/cv";
import CvPreview from "./CvPreview";

type PersonalInfo = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
};

const EMPTY_PERSONAL: PersonalInfo = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  github: "",
};

/** A4 in millimetres. jsPDF works in these, so the arithmetic below does too. */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 10;
/** Render scale for the raster capture. 2 keeps text crisp without huge memory. */
const CAPTURE_SCALE = 2;

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

/**
 * The CV builder: collect rough input on the left, show the finished document on
 * the right.
 *
 * Two notes on how it behaves:
 *
 * - The plan is enforced on the server in three places — this page redirects,
 *   the API answers 403, and the model call is never reached from the browser
 *   without both. Hiding a button here is presentation, not security, so it is
 *   treated as such: the client shows whatever the server said happened.
 * - The PDF is produced by rasterising the preview node rather than by
 *   re-rendering markup for print. One template means the download cannot drift
 *   from the preview, and a long CV is sliced across pages here rather than
 *   coming out as one unreadably long page.
 */
export function CvBuilder({
  initialPersonalInfo,
  initialSkills,
}: {
  initialPersonalInfo?: Partial<PersonalInfo>;
  initialSkills?: string;
}) {
  const [targetRole, setTargetRole] = useState("");
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    ...EMPTY_PERSONAL,
    ...initialPersonalInfo,
  });
  const [skills, setSkills] = useState(initialSkills ?? "");
  const [rawExperience, setRawExperience] = useState("");

  const [cv, setCv] = useState<CvDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const update = (field: keyof PersonalInfo) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { value } = event.target;
    setPersonalInfo((previous) => ({ ...previous, [field]: value }));
  };

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          personalInfo,
          skills,
          rawExperience,
        }),
      });

      const raw = await response.text();
      let data: { cv?: CvDocument; error?: string } | null = null;

      try {
        data = JSON.parse(raw) as { cv?: CvDocument; error?: string };
      } catch {
        // A proxy or host-level error page can answer before this route runs.
        // Keeping the raw body means the failure is still diagnosable.
        console.error(
          `[cv] generate answered ${response.status} with a non-JSON body:`,
          raw.slice(0, 200),
        );
      }

      if (!response.ok || !data?.cv) {
        setError(data?.error ?? "Could not generate your CV. Please try again.");
        return;
      }

      setCv(data.cv);
    } catch {
      setError("Could not reach the CV builder. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Rasterises the preview and writes it to disk as a paginated A4 PDF.
   *
   * The dynamic `import` keeps both libraries out of the initial bundle: they
   * are only needed once someone actually clicks Download, and together they are
   * an order of magnitude larger than this page's own code.
   */
  const handleDownload = async () => {
    const node = previewRef.current;

    if (!node || !cv) {
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(node, {
        scale: CAPTURE_SCALE,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const contentWidthMm = A4_WIDTH_MM - PAGE_MARGIN_MM * 2;
      const contentHeightMm = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2;

      // Scale from captured pixels to millimetres, using the width so the two
      // axes stay in proportion.
      const mmPerPx = contentWidthMm / canvas.width;
      const fullHeightMm = canvas.height * mmPerPx;

      if (fullHeightMm <= contentHeightMm) {
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          PAGE_MARGIN_MM,
          PAGE_MARGIN_MM,
          contentWidthMm,
          fullHeightMm,
        );
      } else {
        // Multi-page: cut the source canvas into page-sized slices. Slicing one
        // long canvas into N images (rather than scaling to fit) keeps text at a
        // readable size on every page.
        const pageHeightPx = Math.floor(contentHeightMm / mmPerPx);
        let offsetY = 0;
        let pageIndex = 0;

        while (offsetY < canvas.height) {
          const sliceHeight = Math.min(
            pageHeightPx,
            canvas.height - offsetY,
          );

          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = sliceHeight;

          const context = slice.getContext("2d");

          if (!context) {
            throw new Error("Could not prepare the PDF page.");
          }

          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, slice.width, slice.height);
          context.drawImage(
            canvas,
            0,
            offsetY,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight,
          );

          if (pageIndex > 0) {
            pdf.addPage();
          }

          pdf.addImage(
            slice.toDataURL("image/png"),
            "PNG",
            PAGE_MARGIN_MM,
            PAGE_MARGIN_MM,
            contentWidthMm,
            sliceHeight * mmPerPx,
          );

          offsetY += sliceHeight;
          pageIndex += 1;
        }
      }

      const safeName =
        personalInfo.fullName.trim().replace(/[^\w\-]+/g, "-") || "cv";

      pdf.save(`${safeName}-cv.pdf`);
    } catch (error) {
      console.error("[cv] PDF export failed:", error);
      setError("Could not build the PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const canGenerate =
    targetRole.trim().length > 0 &&
    personalInfo.fullName.trim().length > 0 &&
    personalInfo.email.trim().length > 0 &&
    rawExperience.trim().length >= CV_MIN_RAW_EXPERIENCE;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form
        onSubmit={handleGenerate}
        className="space-y-5 rounded-card border border-white/10 bg-slate-800 p-6"
      >
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Tailor your CV
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Paste rough, unpolished background — bullet fragments, a summary, a
            job description. The AI rewrites it into a finished CV for the role
            you name.
          </p>
        </div>

        <Field label="Target role">
          <input
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="e.g. Senior Machine Learning Engineer"
            className={inputClass}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              value={personalInfo.fullName}
              onChange={update("fullName")}
              placeholder="Ada Lovelace"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={personalInfo.email}
              onChange={update("email")}
              placeholder="ada@example.com"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Phone">
            <input
              value={personalInfo.phone}
              onChange={update("phone")}
              placeholder="+1 555 0100"
              className={inputClass}
            />
          </Field>

          <Field label="Location">
            <input
              value={personalInfo.location}
              onChange={update("location")}
              placeholder="London, UK"
              className={inputClass}
            />
          </Field>

          <Field label="Website">
            <input
              value={personalInfo.website}
              onChange={update("website")}
              placeholder="ada.dev"
              className={inputClass}
            />
          </Field>

          <Field label="LinkedIn">
            <input
              value={personalInfo.linkedin}
              onChange={update("linkedin")}
              placeholder="linkedin.com/in/ada"
              className={inputClass}
            />
          </Field>

          <Field label="GitHub">
            <input
              value={personalInfo.github}
              onChange={update("github")}
              placeholder="github.com/ada"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Existing skills (comma separated)">
          <input
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            placeholder="Python, PyTorch, MLOps, SQL"
            className={inputClass}
          />
        </Field>

        <Field label="Raw experience & background">
          <textarea
            value={rawExperience}
            onChange={(event) => setRawExperience(event.target.value)}
            rows={10}
            placeholder={
              "Anything at all. E.g. '3 years at Acme building LLM eval tooling in Python. Cut inference cost 40%. Led 2 engineers. MSc in CS.'\n\nThe AI is told not to invent anything you did not write here."
            }
            className={`${inputClass} resize-y leading-relaxed`}
            required
            minLength={CV_MIN_RAW_EXPERIENCE}
          />
          <p className="mt-1 text-xs text-slate-500">
            {rawExperience.trim().length < CV_MIN_RAW_EXPERIENCE
              ? `${CV_MIN_RAW_EXPERIENCE - rawExperience.trim().length} more characters needed.`
              : "Ready to generate."}
          </p>
        </Field>

        <button
          type="submit"
          disabled={isGenerating || !canGenerate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Writing your CV…
            </>
          ) : (
            <>
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Generate CV
            </>
          )}
        </button>

        {error && (
          <p role="alert" className="text-center text-xs text-rose-300">
            {error}
          </p>
        )}
      </form>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
            <FileText aria-hidden="true" className="h-5 w-5" />
            Preview
          </h2>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!cv || isExporting}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-blue-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Building PDF…
              </>
            ) : (
              <>
                <Download aria-hidden="true" className="h-4 w-4" />
                Download as PDF
              </>
            )}
          </button>
        </div>

        <div className="overflow-hidden rounded-card border border-white/10 bg-slate-800">
          <div ref={previewRef}>
            <CvPreview cv={cv} personalInfo={personalInfo} />
          </div>
        </div>
      </section>
    </div>
  );
}

export default CvBuilder;