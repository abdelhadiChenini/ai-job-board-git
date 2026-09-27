"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { FaqItem } from "@/lib/faq";
import { serializeFaqItems } from "@/lib/faq";

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none";

const emptyItem: FaqItem = { question: "", answer: "" };

export default function FaqItemsEditor({
  initialItems,
}: {
  initialItems: FaqItem[];
}) {
  const [items, setItems] = useState<FaqItem[]>(
    initialItems.length > 0 ? initialItems : [{ ...emptyItem }],
  );

  const updateItem = (index: number, patch: Partial<FaqItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="hidden"
        name="faqItems"
        value={serializeFaqItems(items)}
        readOnly
      />

      {items.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-900/40 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Item {index + 1}
            </p>
            <button
              type="button"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
              aria-label={`Remove FAQ item ${index + 1}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-red-500/50 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </button>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Question
            <input
              type="text"
              value={item.question}
              maxLength={200}
              onChange={(event) => updateItem(index, { question: event.target.value })}
              placeholder="What is this platform?"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Answer
            <textarea
              rows={4}
              value={item.answer}
              onChange={(event) => updateItem(index, { answer: event.target.value })}
              placeholder="AI Job Board curates remote work and freelance opportunities."
              className={inputClass}
            />
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-blue-500 hover:text-white"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add FAQ item
      </button>
    </div>
  );
}
