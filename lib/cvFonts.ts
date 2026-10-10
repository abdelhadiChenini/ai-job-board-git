import {
  Inter,
  Merriweather,
  Playfair_Display,
  Roboto,
  Space_Mono,
} from "next/font/google";

/**
 * Typography pairings for the AI CV Builder.
 *
 * All fonts are self-hosted by `next/font` at build time, so the browser never
 * talks to the Google CDN and the PDF capture (html2canvas) can measure them
 * from the same cached files. The registry maps the short ids used in the
 * toolbar state to a display label and the generated class that applies the
 * family to the CV wrapper.
 */
const inter = Inter({ subsets: ["latin"] });
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
});
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export type CvFontId =
  | "inter"
  | "merriweather"
  | "roboto"
  | "playfair"
  | "mono";

export const CV_FONTS: Record<CvFontId, { label: string; className: string }> =
  {
    inter: { label: "Sans-Serif (Inter)", className: inter.className },
    merriweather: {
      label: "Serif (Merriweather)",
      className: merriweather.className,
    },
    roboto: { label: "Modern (Roboto)", className: roboto.className },
    playfair: {
      label: "Elegant (Playfair Display)",
      className: playfair.className,
    },
    mono: { label: "Monospace", className: spaceMono.className },
  };

export const CV_FONT_OPTIONS = Object.entries(CV_FONTS).map(
  ([value, { label }]) => ({ value: value as CvFontId, label }),
);