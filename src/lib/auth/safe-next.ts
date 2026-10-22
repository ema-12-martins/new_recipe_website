import { locales, type Locale } from "@/i18n/config";

const LOCALE_PREFIX = new RegExp(`^/(${locales.join("|")})/`);

/**
 * Open-redirect guard: only same-site paths under a locale segment are kept;
 * anything else (absolute, protocol-relative, backslash, scheme) falls back
 * to the cookbook.
 */
export function safeNextPath(next: string | null | undefined, locale: Locale): string {
  const fallback = `/${locale}/recipes`;
  if (typeof next !== "string") return fallback;
  if (!LOCALE_PREFIX.test(next)) return fallback;
  if (next.startsWith("//") || next.includes("\\") || next.includes("://")) return fallback;
  // Control characters (including tab/newline) can be stripped by browsers into a different URL.
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}

/** Replaces the first path segment (the locale) of a path that passed safeNextPath. */
export function withLocale(path: string, locale: Locale): string {
  return path.replace(LOCALE_PREFIX, `/${locale}/`);
}
