"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqAccordionProps = {
  items: { question: string; answer: string }[];
};

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="mb-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between p-5 font-semibold text-slate-100"
            >
              {item.question}
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="p-5 pt-0 text-slate-400 leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}