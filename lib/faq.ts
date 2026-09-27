export type FaqItem = {
  question: string;
  answer: string;
};

export const DEFAULT_FAQ: FaqItem[] = [
  {
    question: "What is this platform?",
    answer:
      "AI Job Board curates remote work and freelance opportunities from the world's leading AI labs and platforms.",
  },
  {
    question: "How do I apply for roles?",
    answer:
      "Open an opportunity and follow its affiliate link. Each listing directs you to the official application page on the partner platform.",
  },
  {
    question: "Are the listed opportunities free to join?",
    answer:
      "Yes. Browsing and applying through our curated listings is completely free.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "You can browse public listings without an account. Creating a free account lets you save opportunities and manage your expert profile.",
  },
  {
    question: "How can I get my opportunities listed?",
    answer:
      "Reach out through the contact link available in the footer and our team will help you get started.",
  },
];

function toFaqItem(value: unknown): FaqItem | null {
  if (typeof value !== "object" || value === null) return null;

  const { question, answer } = value as { question?: unknown; answer?: unknown };
  if (typeof question !== "string" || typeof answer !== "string") return null;

  return { question, answer };
}

function isBlank(item: FaqItem): boolean {
  return item.question.trim().length === 0 && item.answer.trim().length === 0;
}

/**
 * Legacy format: a question and an answer per block, separated by blank lines.
 * Retained so content saved before the Q/A field refactor keeps rendering.
 */
function parseLegacyFaqText(raw: string): FaqItem[] {
  const blocks = raw
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  const items: FaqItem[] = [];
  for (let i = 0; i < blocks.length; i += 2) {
    items.push({ question: blocks[i], answer: blocks[i + 1] ?? "" });
  }
  return items;
}

/**
 * Reads the `content` column of the Page record with slug "faq", accepting
 * either the structured JSON format or the legacy blank-line plain text.
 */
export function parseFaqContent(raw: string | null | undefined): FaqItem[] {
  const trimmed = raw?.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map(toFaqItem)
          .filter((item): item is FaqItem => item !== null && !isBlank(item));
      }
    } catch {
      return parseLegacyFaqText(trimmed);
    }
  }

  return parseLegacyFaqText(trimmed);
}

/**
 * Parses the hidden form field submitted by the admin Q/A editor.
 * Returns null when the payload is malformed so callers can reject the save.
 */
export function parseFaqItemsField(raw: string | null | undefined): FaqItem[] | null {
  const trimmed = raw?.trim();
  if (!trimmed) return [];

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return null;

    const items: FaqItem[] = [];
    for (const entry of parsed) {
      const item = toFaqItem(entry);
      if (item === null) return null;
      items.push(item);
    }
    return items;
  } catch {
    return null;
  }
}

export function serializeFaqItems(items: FaqItem[]): string {
  return JSON.stringify(
    items
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      }))
      .filter((item) => !isBlank(item)),
  );
}
