/** The name the database gives a new cookbook (`cookbooks.name` default). */
export const DEFAULT_COOKBOOK_NAME = "Family cookbook";

/**
 * The cookbook name to show. Until the family names it, the English database default would
 * appear on Portuguese pages, so the localised app name is shown instead.
 */
export function displayCookbookName(name: string, appName: string): string {
  const trimmed = name.trim();
  return trimmed === "" || trimmed === DEFAULT_COOKBOOK_NAME ? appName : name;
}
