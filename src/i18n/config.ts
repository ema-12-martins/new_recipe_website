export const locales = ["pt", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";

export const LOCALE_COOKIE = "NEXT_LOCALE";

// Endonyms: each language is always shown in its own name, never translated.
export const LOCALE_NAMES: Record<Locale, string> = {
  pt: "Português",
  en: "English",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Picks the highest-weighted Accept-Language tag whose primary subtag is a
 * supported locale; anything else falls back to Portuguese (D-27).
 */
export function detectLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;

  const candidates = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [rawTag, ...params] = part.trim().split(";");
      let quality = 1;
      for (const param of params) {
        const [key, value] = param.trim().split("=");
        if (key === "q") {
          const parsed = Number.parseFloat(value);
          quality = Number.isFinite(parsed) ? parsed : 0;
        }
      }
      const primary = rawTag.trim().toLowerCase().split("-")[0];
      return { primary, quality, index };
    })
    .filter((candidate) => candidate.quality > 0 && isLocale(candidate.primary))
    // Stable on equal weights: earlier tags win, as in the header order.
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  return candidates.length > 0 ? (candidates[0].primary as Locale) : defaultLocale;
}
