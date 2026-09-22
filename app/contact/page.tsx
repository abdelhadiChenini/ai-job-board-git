import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center py-12">
      <section className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="rounded-full border border-white/10 bg-navy-light px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-300">
          We&apos;d love to hear from you
        </p>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Contact Us
        </h1>
        <p className="max-w-xl text-base text-slate-400">
          Questions about listings, partnerships or your expert profile? Drop us
          a message and our team will get right back to you.
        </p>
      </section>

      <section className="w-full max-w-2xl rounded-card bg-white p-6 shadow-2xl sm:p-8">
        <ContactForm />
      </section>
    </div>
  );
}