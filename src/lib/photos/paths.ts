/** Object path inside the private bucket: {cookbook}/{recipe}/{photo}.jpg (matches the table check). */
export function photoPath(cookbookId: string, recipeId: string, photoId: string): string {
  return `${cookbookId}/${recipeId}/${photoId}.jpg`;
}

/** Same-origin, membership-checked URL for one photo. */
export function photoUrl(recipeId: string, photoId: string): string {
  return `/api/recipes/${recipeId}/photos/${photoId}`;
}
