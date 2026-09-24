"use client";

import { FormEvent, useState } from "react";

type ContextType = "opportunity" | "blog" | "email";

type AIAssistantButtonProps = {
  contextType: ContextType;
  onGenerate: (text: string) => void;
  placeholder?: string;
};

export function AIAssistantButton({
  contextType,
  onGenerate,
  placeholder = "e.g. Write a job description for a Remote AI Evaluator",
}: AIAssistantButtonProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || !prompt.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, contextType }),
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          (data as { error?: string } | null)?.error ??
            "AI generation failed. Please try again.",
        );
        return;
      }

      const text = (data as { text?: unknown } | null)?.text;
      if (typeof text === "string" && text) {
        onGenerate(text);
        setOpen(false);
        setPrompt("");
      } else {
        setError("The AI did not return any content.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setError(null);
        }}
        aria-expanded={open}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300 transition-colors hover:border-purple-400/60 hover:text-purple-200"
      >
        ✨ Generate with AI
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`ai-prompt-${contextType}`}
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Describe what to generate
            </label>
            <textarea
              id={`ai-prompt-${contextType}`}
              rows={3}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden="true"
                  />
                  Generating…
                </>
              ) : (
                "Generate"
              )}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AIAssistantButton;