export type CvTemplateId =
  | "minimalist"
  | "professional"
  | "modern"
  | "executive"
  | "creative";

/**
 * Template registry for the AI CV Builder toolbar and preview dispatch.
 *
 * The ids are the source of truth; `CvPreview` switches on them and the toolbar
 * renderers every entry so the dropdown can never drift from the layouts.
 */
export const CV_TEMPLATE_OPTIONS: { value: CvTemplateId; label: string }[] = [
  { value: "minimalist", label: "Minimalist" },
  { value: "professional", label: "Professional" },
  { value: "modern", label: "Modern" },
  { value: "executive", label: "Executive" },
  { value: "creative", label: "Creative" },
];