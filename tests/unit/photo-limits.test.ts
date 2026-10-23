import { describe, expect, it } from "vitest";

import { MAX_PHOTOS } from "@/lib/photos/limits";
import { photoPath, photoUrl } from "@/lib/photos/paths";
import { fitWithin } from "@/lib/photos/resize";
import { photoIdsSchema } from "@/lib/photos/schema";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("fitWithin", () => {
  it("keeps the aspect ratio and limits the longer side", () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(3000, 4000, 2000)).toEqual({ width: 1500, height: 2000 });
  });

  it("never enlarges a photo that is already small enough", () => {
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(2000, 1000, 2000)).toEqual({ width: 2000, height: 1000 });
  });
});

describe("photo paths", () => {
  it("names the file after cookbook, recipe and photo, matching the table check", () => {
    expect(photoPath("c", "r", "p")).toBe("c/r/p.jpg");
  });

  it("points the page at the membership-checked route", () => {
    expect(photoUrl("r", "p")).toBe("/api/recipes/r/photos/p");
  });
});

describe("photo id list", () => {
  it("accepts up to the photo limit", () => {
    const ids = Array.from({ length: MAX_PHOTOS }, (_, i) => id(i + 1));
    expect(photoIdsSchema.safeParse(ids).success).toBe(true);
    expect(photoIdsSchema.safeParse([]).success).toBe(true);
  });

  it("rejects a seventh photo", () => {
    const ids = Array.from({ length: MAX_PHOTOS + 1 }, (_, i) => id(i + 1));
    expect(photoIdsSchema.safeParse(ids).success).toBe(false);
  });

  it("rejects repeated ids and values that are not uuids", () => {
    expect(photoIdsSchema.safeParse([id(1), id(1)]).success).toBe(false);
    expect(photoIdsSchema.safeParse(["not-a-uuid"]).success).toBe(false);
  });
});
