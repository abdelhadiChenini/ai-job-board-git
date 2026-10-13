import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { safeRead } from "@/lib/safeQuery";

/**
 * B2B trust signals for the landing page.
 *
 * The partner logos are the same Cloudinary assets the AI Platforms directory
 * renders, so the banner always mirrors what each platform shows there. Slugs
 * are matched against `AIPlatform` and a faded wordmark is used as a fallback
 * if a platform has no logo on file.
 */

const partnerBrands = [
  {
    name: "Turing",
    slug: "turing",
    mark: "T",
    accent: "from-blue-500 to-cyan-400",
    text: "text-blue-300",
  },
  {
    name: "Micro1",
    slug: "mirco1",
    mark: "M1",
    accent: "from-indigo-500 to-violet-400",
    text: "text-indigo-300",
  },
  {
    name: "RWS",
    slug: "rws",
    mark: "R",
    accent: "from-rose-500 to-red-400",
    text: "text-rose-300",
  },
  {
    name: "TELUS International",
    slug: "telus-digital",
    mark: "TI",
    accent: "from-emerald-500 to-teal-400",
    text: "text-emerald-300",
  },
] as const;

export async function TrustedExperience() {
  const logos = await safeRead(
    "trusted experience logos",
    () =>
      prisma.aIPlatform.findMany({
        where: { slug: { in: partnerBrands.map((brand) => brand.slug) } },
        select: { slug: true, logoUrl: true },
      }),
    [],
  );

  const logoBySlug = new Map(
    logos.map((platform) => [platform.slug, platform.logoUrl]),
  );

  return (
    <section aria-labelledby="trusted-experience-heading" className="mt-12">
      <p
        id="trusted-experience-heading"
        className="mx-auto max-w-3xl text-center text-sm text-slate-400"
      >
        Our network features vetted experts with experience at leading AI labs
        and platforms.
      </p>

      <ul className="mt-8 grid grid-cols-2 items-center gap-x-6 gap-y-8 rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-8 sm:grid-cols-4">
        {partnerBrands.map((brand) => {
          const logoUrl = logoBySlug.get(brand.slug);
          return (
            <li
              key={brand.name}
              className="flex items-center justify-center grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
            >
              {logoUrl ? (
                <span className="relative h-9 w-24 sm:h-10 sm:w-28">
                  <Image
                    src={logoUrl}
                    alt={`${brand.name} logo`}
                    fill
                    sizes="(min-width: 640px) 7rem, 6rem"
                    className="object-contain"
                  />
                </span>
              ) : (
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${brand.accent} text-xs font-black text-white`}
                  >
                    {brand.mark}
                  </span>
                  <span
                    className={`text-sm font-bold tracking-tight sm:text-base ${brand.text}`}
                  >
                    {brand.name}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const talentStats = [
  {
    value: "2,400+",
    label: "Active roles",
    hint: "Open across AI labs and data platforms",
  },
  {
    value: "98%",
    label: "Verified talent",
    hint: "Profiles reviewed before they reach the directory",
  },
] as const;

export function VerifiedTalent() {
  return (
    <section aria-labelledby="verified-talent-heading" className="mt-16">
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 p-8 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
                aria-hidden="true"
              />
              Verified Talent
            </span>

            <h2
              id="verified-talent-heading"
              className="mt-4 bg-gradient-to-r from-white via-accent to-emerald-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent"
            >
              A network you can trust on both sides.
            </h2>

            <p className="mt-3 max-w-xl text-slate-400">
              Every expert profile is reviewed before it reaches the directory,
              and roles are sourced from established AI labs and data platforms —
              so experts find real work and companies meet real talent.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {talentStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center"
              >
                <p className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-200">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {stat.hint}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
