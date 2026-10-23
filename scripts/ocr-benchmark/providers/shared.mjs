// Helpers shared by the benchmark providers. Nothing here logs recipe text or credentials.

export function fail(kind, message) {
  return Object.assign(new Error(message), { kind });
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw fail("config", `${name} is not set in the environment`);
  return value;
}

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export function mimeFor(fileName) {
  const dot = fileName.lastIndexOf(".");
  const mime = dot >= 0 ? MIME[fileName.slice(dot).toLowerCase()] : undefined;
  if (!mime) throw fail("config", `unsupported image type: ${fileName}`);
  return mime;
}

const INGREDIENTS_HEADING = /^(ingredientes|ingredients)\s*:?$/i;
const STEPS_HEADING =
  /^(modo de prepara[çc][ãa]o|prepara[çc][ãa]o|preparo|m[ée]todo|instru[çc][õo]es|method|instructions|directions|steps)\s*:?$/i;

/**
 * Turns plain OCR text into a draft: the first line is the title, then ingredient lines, then
 * steps, split at headings. Used only by the OCR-only candidates; it is deliberately simple so
 * the score measures the provider, not a clever parser.
 */
export function draftFromText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  const title = lines.shift() ?? "";
  const ingredients = [];
  const steps = [];
  let section = "ingredients";

  for (const line of lines) {
    if (INGREDIENTS_HEADING.test(line)) section = "ingredients";
    else if (STEPS_HEADING.test(line)) section = "steps";
    else if (section === "ingredients") ingredients.push(line);
    else steps.push(line.replace(/^\d+\s*[.)-]\s*/, ""));
  }
  return { title, ingredients, steps };
}

export function assertDraft(draft) {
  const strings = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");
  if (!draft || typeof draft.title !== "string" || !strings(draft.ingredients) || !strings(draft.steps)) {
    throw fail("invalid", "the provider response is not a recipe draft");
  }
  return draft;
}
