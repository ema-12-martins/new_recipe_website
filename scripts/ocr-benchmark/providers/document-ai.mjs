// Google Document AI (Enterprise Document OCR) over HTTPS. Plain OCR text becomes a draft with
// a simple heading heuristic, so this measures the OCR step on its own.
//
// Environment (shell only, never written to disk):
//   DOCUMENT_AI_ENDPOINT  full URL of an EU processor ending in ":process"
//   GCP_ACCESS_TOKEN      short-lived token, for example from `gcloud auth print-access-token`

import { draftFromText, fail, mimeFor, requireEnv } from "./shared.mjs";

export async function recognize({ images }) {
  const endpoint = requireEnv("DOCUMENT_AI_ENDPOINT");
  const token = requireEnv("GCP_ACCESS_TOKEN");

  const pages = [];
  for (const image of images) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        rawDocument: { content: image.data.toString("base64"), mimeType: mimeFor(image.name) },
      }),
    });
    if (!response.ok) throw fail("http", `Document AI answered ${response.status}`);
    const body = await response.json();
    const text = body?.document?.text;
    if (typeof text !== "string") throw fail("invalid", "Document AI returned no text");
    pages.push(text);
  }
  return draftFromText(pages.join("\n"));
}
