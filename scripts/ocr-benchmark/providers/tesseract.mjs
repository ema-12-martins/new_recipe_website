// Tesseract (tesseract.js) running locally, with the same bundled Portuguese and English
// language data as the app (src/lib/recognition/tessdata): nothing leaves this machine.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createWorker } from "tesseract.js";

import { assertDraft, draftFromText, fail } from "./shared.mjs";

const LANG_PATH = join(dirname(fileURLToPath(import.meta.url)), "../../../src/lib/recognition/tessdata");

let workerPromise;

function getWorker() {
  workerPromise ??= createWorker(["por", "eng"], 1, { langPath: LANG_PATH, cacheMethod: "none" });
  return workerPromise;
}

export async function recognize({ images }) {
  const worker = await getWorker();
  const pages = [];
  for (const image of images) {
    const { data } = await worker.recognize(image.data);
    pages.push(data.text);
  }
  const text = pages.join("\n");
  if (text.trim() === "") throw fail("empty", "Tesseract found no text");
  return assertDraft(draftFromText(text));
}

export async function close() {
  if (workerPromise) await (await workerPromise).terminate();
}
