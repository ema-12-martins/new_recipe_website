// Vertex AI Gemini with a JSON response schema, over HTTPS. The model reads the page images
// directly and returns the draft fields.
//
// Environment (shell only, never written to disk):
//   GEMINI_ENDPOINT   full URL of an EU Vertex AI model, ending in ":generateContent"
//   GCP_ACCESS_TOKEN  short-lived token, for example from `gcloud auth print-access-token`

import { assertDraft, fail, mimeFor, requireEnv } from "./shared.mjs";

const PROMPT =
  "Transcribe this handwritten recipe exactly as written, reading the pages in the order given. " +
  "Keep the original language, wording, accents, quantities and units; do not translate, correct " +
  "or convert anything. Return the title, the ingredient lines (one entry per line) and the " +
  "method steps in order without numbering.";

const SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    ingredients: { type: "ARRAY", items: { type: "STRING" } },
    steps: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "ingredients", "steps"],
};

export async function recognize({ images }) {
  const endpoint = requireEnv("GEMINI_ENDPOINT");
  const token = requireEnv("GCP_ACCESS_TOKEN");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            ...images.map((image) => ({
              inlineData: { mimeType: mimeFor(image.name), data: image.data.toString("base64") },
            })),
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0 },
    }),
  });
  if (!response.ok) throw fail("http", `Gemini answered ${response.status}`);

  const body = await response.json();
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") throw fail("invalid", "Gemini returned no content");
  try {
    return assertDraft(JSON.parse(text));
  } catch (error) {
    throw error.kind ? error : fail("invalid", "Gemini returned text that is not JSON");
  }
}
