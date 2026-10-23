/** Provider names that RECOGNITION_PROVIDER can select (02-PROVIDER-DECISION.md). */
export type ProviderName = "tesseract" | "stub";

/**
 * Server-only setting: unset or "tesseract" reads with Tesseract, "stub" returns a fixed draft
 * for tests, anything else (for example "off") hides Read recipe.
 */
export function configuredProvider(): ProviderName | null {
  const value = process.env.RECOGNITION_PROVIDER || "tesseract";
  return value === "tesseract" || value === "stub" ? value : null;
}
