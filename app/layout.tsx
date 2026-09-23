import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Footer from "@/app/components/Footer";
import Providers from "./Providers";
import { prisma } from "@/lib/prisma";

const DEFAULT_TITLE = "AI Job Board";
const DEFAULT_DESCRIPTION =
  "Curated job listings from the world's leading AI labs and platforms.";

const fonts = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue",
  Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;

async function getSeo() {
  return prisma.seoSetting.findUnique({ where: { id: "global" } });
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();

  return {
    title: {
      default: seo?.siteTitle || DEFAULT_TITLE,
      template: `%s | ${seo?.siteTitle || DEFAULT_TITLE}`,
    },
    description: seo?.metaDescription || DEFAULT_DESCRIPTION,
    keywords: seo?.keywords
      ? seo.keywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean)
      : undefined,
    icons: seo?.logoUrl
      ? { icon: seo.logoUrl, apple: seo.logoUrl }
      : undefined,
    openGraph: {
      siteName: seo?.siteTitle || DEFAULT_TITLE,
      description: seo?.metaDescription || DEFAULT_DESCRIPTION,
      ...(seo?.logoUrl ? { images: [{ url: seo.logoUrl }] } : {}),
    },
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const seo = await getSeo();

  return (
    <html lang="en" dir="ltr">
      {seo?.headerInjection && (
        <head>
          <div dangerouslySetInnerHTML={{ __html: seo.headerInjection }} />
        </head>
      )}
      <body
        style={{ fontFamily: fonts }}
        className="min-h-screen bg-navy text-white antialiased"
      >
        {seo?.bodyInjection && (
          <div dangerouslySetInnerHTML={{ __html: seo.bodyInjection }} />
        )}
        <div className="site-shell">
          <Providers>{children}</Providers>
        </div>
        <Footer />
        {seo?.footerInjection && (
          <div dangerouslySetInnerHTML={{ __html: seo.footerInjection }} />
        )}
        <Analytics />
      </body>
    </html>
  );
}