/** A recipe read from photos. It is only ever a draft until the member presses Save (CAPT-03). */
export type DraftRecipe = { title: string; ingredients: string[]; steps: string[] };

/** Why a read did not produce a usable draft (D-10). */
export type RecognitionFailure =
  | "unavailable"
  | "timeout"
  | "empty"
  | "low_quality"
  | "invalid"
  | "too_large";

export type RecognitionOutput = {
  draft: DraftRecipe;
  /** Mean provider confidence from 0 to 100, or null when the provider gives none. */
  confidence: number | null;
};

export type RecognitionProvider = {
  name: string;
  recognize(input: {
    images: Uint8Array[];
    language: "pt" | "en";
    signal: AbortSignal;
  }): Promise<RecognitionOutput>;
};

export type ReadResponse = { draft: DraftRecipe } | { failure: RecognitionFailure };
