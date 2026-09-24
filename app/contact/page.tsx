import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
};

const directContacts = [
  { label: "General inquiries", value: "contact@aijobboard.com" },
  { label: "Business partnerships", value: "partnerships@aijobboard.com" },
  { label: "Support", value: "support@aijobboard.com" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="inline-flex rounded-full border border-white/10 bg-slate-900/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-300">
          We&apos;d love to hear from you
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">
          Start a conversation
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          Questions about listings, partnerships or your expert profile? Drop
          us a message and our team will get back to you within 24 hours.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 lg:col-span-2">
          <ContactForm />
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
            <h2 className="text-lg font-bold text-slate-100">
              Reach us directly
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Prefer email? Send us a note and we&apos;ll respond as soon as
              possible.
            </p>
            <ul className="mt-5 space-y-4">
              {directContacts.map((contact) => (
                <li key={contact.label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {contact.label}
                  </p>
                  <a
                    href={`mailto:${contact.value}`}
                    className="mt-1 inline-block text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300"
                  >
                    {contact.value}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
            <h2 className="text-lg font-bold text-slate-100">
              Looking for an opportunity?
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Browse live roles from leading AI labs and remote platforms.
            </p>
            <Link
              href="/opportunities"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Browse opportunities
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
            <h2 className="text-lg font-bold text-slate-100">
              Looking to hire experts?
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Post a role and reach vetted AI talent at any scale.
            </p>
            <Link
              href="/for-companies"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
            >
              Hire talent
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}