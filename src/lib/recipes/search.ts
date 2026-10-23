/** Lower-case and strip accents, so "acucar" finds "Açúcar" and "ABACAXI" finds "Ábacaxi". */
export function foldText(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Folded text a recipe is searched by: its title and every ingredient line. */
export function searchableText(recipe: { title: string; ingredients: string[] }): string {
  return foldText([recipe.title, ...recipe.ingredients].join("\n"));
}

/** Every word of the query must appear somewhere in the recipe's searchable text. */
export function matchesQuery(query: string, searchable: string): boolean {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  return words.every((word) => searchable.includes(word));
}
