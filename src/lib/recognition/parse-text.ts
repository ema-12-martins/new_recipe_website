import type { DraftRecipe } from "./types";

// OCR often misreads the first letter of a heading ("Wodo de preparação"), so it is optional.
const INGREDIENTS_HEADING = /^\S?(ngredientes|ngredients)\s*:?$/i;
const STEPS_HEADING =
  /^(\S?odo de prepara[çc][ãa]o|prepara[çc][ãa]o|preparo|m[ée]todo|instru[çc][õo]es|method|instructions|directions|steps)\s*:?$/i;
const NUMBERED = /^\d{1,2}\s*[.)-]\s+/;

/**
 * Splits plain OCR text into a draft: the first line is the title, then ingredient lines, then
 * steps, split at the usual headings. Without a steps heading, numbered lines ("1. ...") are
 * taken as steps. Only structure is removed (headings and step numbers); the wording of every
 * line is kept as read (Phase 1 D-11).
 */
export function draftFromText(text: string): DraftRecipe {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  const title = lines.shift() ?? "";
  const hasStepsHeading = lines.some((line) => STEPS_HEADING.test(line));
  const ingredients: string[] = [];
  const steps: string[] = [];
  let section: "ingredients" | "steps" = "ingredients";

  for (const line of lines) {
    if (INGREDIENTS_HEADING.test(line)) section = "ingredients";
    else if (STEPS_HEADING.test(line)) section = "steps";
    else if (section === "steps" || (!hasStepsHeading && NUMBERED.test(line))) {
      steps.push(line.replace(NUMBERED, ""));
    } else ingredients.push(line);
  }
  return { title, ingredients, steps };
}
