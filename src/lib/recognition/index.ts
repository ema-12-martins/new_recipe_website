import "server-only";

import { configuredProvider } from "./config";
import { groqProvider } from "./groq";
import { stubProvider } from "./stub";
import { tesseractProvider } from "./tesseract";
import type { RecognitionProvider } from "./types";

/** The approved provider selected by RECOGNITION_PROVIDER, or null when reading is off. */
export function getProvider(): RecognitionProvider | null {
  switch (configuredProvider()) {
    case "groq":
      return groqProvider;
    case "tesseract":
      return tesseractProvider;
    case "stub":
      return stubProvider;
    default:
      return null;
  }
}
