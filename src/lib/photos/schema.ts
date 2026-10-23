import { z } from "zod";

import { MAX_PHOTOS } from "./limits";

/** Ordered photo ids submitted with the recipe form: uuids, no repeats, at most six. */
export const photoIdsSchema = z
  .array(z.uuid())
  .max(MAX_PHOTOS)
  .refine((ids) => new Set(ids).size === ids.length);

export type PhotoRow = { id: string; position: number };
