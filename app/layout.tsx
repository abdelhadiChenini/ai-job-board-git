import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Footer from "@/app/components/Footer";
import TopNav from "@/app/components/TopNav";
import Providers from "./Providers";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

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
  const [seo, globalSettings] = await Promise.all([
    getSeo(),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  const isMaintenanceMode = globalSettings?.isMaintenanceMode ?? false;
  const isAdmin = isMaintenanceMode ? !!(await getAdminSession()) : false;

  if (isMaintenanceMode && !isAdmin) {
    return (
      <html lang="en" dir="ltr">
        <body
          style={{ fontFamily: fonts }}
          className="min-h-screen overflow-x-hidden bg-[#0B0F19] text-slate-200 antialiased"
        >
          <div className="flex h-screen items-center justify-center px-6 text-center">
            <div>
              <h1 className="mb-4 text-3xl font-bold">Under Maintenance</h1>
              <p className="text-slate-400">
                We are currently rolling out a major update. We will be right
                back.
              </p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" dir="ltr">
      {seo?.headerInjection && (
        <head>
          <div dangerouslySetInnerHTML={{ __html: seo.headerInjection }} />
        </head>
      )}
      <body
        style={{ fontFamily: fonts }}
        className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-300 antialiased"
      >
        {isAdmin && isMaintenanceMode && (
          <div className="bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white">
            Maintenance Mode Active
          </div>
        )}
        {seo?.bodyInjection && (
          <div dangerouslySetInnerHTML={{ __html: seo.bodyInjection }} />
        )}
        <Providers>
          <TopNav />
          <div className="w-full px-6 py-8 md:px-12 lg:px-20">{children}</div>
          <Footer />
        </Providers>
        {seo?.footerInjection && (
          <div dangerouslySetInnerHTML={{ __html: seo.footerInjection }} />
        )}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}