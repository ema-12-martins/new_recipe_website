/** Provider names that RECOGNITION_PROVIDER can select (02-PROVIDER-DECISION.md). */
export type ProviderName = "groq" | "tesseract" | "stub";

/**
 * Server-only setting. Unset: Groq when GROQ_API_KEY is configured, otherwise Tesseract.
 * Explicit values: "groq", "tesseract", "stub" (fixed draft for tests); anything else (for
 * example "off") hides Read recipe.
 */
export function configuredProvider(): ProviderName | null {
  const value = process.env.RECOGNITION_PROVIDER || (process.env.GROQ_API_KEY ? "groq" : "tesseract");
  return value === "groq" || value === "tesseract" || value === "stub" ? value : null;
}
