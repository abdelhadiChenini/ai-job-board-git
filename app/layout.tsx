import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Footer from "@/app/components/Footer";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: {
    default: "AI Job Board",
    template: "%s | AI Job Board",
  },
  description:
    "Curated job listings from the world's leading AI labs and platforms.",
};

const fonts = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue",
  Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body style={{ fontFamily: fonts }} className="min-h-screen bg-navy text-white antialiased">
        <div className="site-shell">
          <Providers>{children}</Providers>
        </div>
        <Footer />
      </body>
    </html>
  );
}