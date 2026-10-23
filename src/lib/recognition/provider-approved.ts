import "server-only";

import { configuredProvider } from "./config";

/** Whether the capture screen offers Read recipe; does not load any provider code. */
export function isRecognitionEnabled(): boolean {
  return configuredProvider() !== null;
}
