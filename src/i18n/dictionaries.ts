import type { Locale } from "./config";
import en from "./messages/en.json";
import pt from "./messages/pt.json";

// Portuguese is the primary copy (D-20); English must keep the same shape.
export type Dictionary = typeof pt;

const dictionaries: Record<Locale, Dictionary> = { pt, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
