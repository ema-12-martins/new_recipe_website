import type { DraftRecipe, RecognitionFailure } from "./types";

/**
 * Low-quality threshold (D-10), copied from
 * .planning/phases/02-handwritten-recipe-capture/02-PROVIDER-DECISION.md.
 */
export const RECOGNITION_QUALITY = {
  minConfidence: 50,
  minCharacters: 20,
  minLines: 1,
} as const;

const characters = (draft: DraftRecipe) =>
  [draft.title, ...draft.ingredients, ...draft.steps].join("").replace(/\s/g, "").length;

/** Why a draft is not usable, or null when it is good enough to review. */
export function draftProblem(
  draft: DraftRecipe,
  confidence: number | null,
): Extract<RecognitionFailure, "empty" | "low_quality"> | null {
  const total = characters(draft);
  if (total === 0) return "empty";
  if (confidence !== null && confidence < RECOGNITION_QUALITY.minConfidence) return "low_quality";
  if (total < RECOGNITION_QUALITY.minCharacters) return "low_quality";
  if (draft.title.trim() === "") return "low_quality";
  if (draft.ingredients.length + draft.steps.length < RECOGNITION_QUALITY.minLines) {
    return "low_quality";
  }
  return null;
}

export function isUsableDraft(draft: DraftRecipe, confidence: number | null = null): boolean {
  return draftProblem(draft, confidence) === null;
}
