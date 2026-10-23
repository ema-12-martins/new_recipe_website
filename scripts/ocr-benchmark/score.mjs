// Correction-effort scoring for handwritten-recipe recognition (Phase 2, decision D-16).
// Everything is compared exactly: no case folding and no accent stripping, because a
// recipe's wording, quantities and units must survive recognition unchanged (D-11).

const UNICODE_FRACTIONS = "½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒";

const UNITS = [
  "g", "kg", "mg", "ml", "l", "dl", "cl",
  "colher", "colheres", "chávena", "chávenas", "chavena", "chavenas", "copo", "copos",
  "cup", "cups", "tbsp", "tsp", "tablespoon", "tablespoons", "teaspoon", "teaspoons",
  "oz", "lb", "pitada", "fatia", "fatias", "dente", "dentes",
  "minuto", "minutos", "minute", "minutes", "min", "hora", "horas", "hour", "hours",
];

const TEMPERATURE = new RegExp(
  `\\d{2,3}\\s?(?:°\\s?[CcFf]|º\\s?[Cc]?|graus|degrees)(?![\\p{L}])`,
  "gu",
);

const QUANTITY = new RegExp(
  [
    `\\d+\\s+\\d+\\s?/\\s?\\d+`, // 1 1/2
    `\\d+\\s?/\\s?\\d+`, // 1/2
    `\\d+[.,]\\d+`, // 2,5
    `\\d*[${UNICODE_FRACTIONS}]`, // ½ or 1½
    `\\d+`,
  ].join("|"),
  "gu",
);

const UNIT = new RegExp(`(?<![\\p{L}])(?:${UNITS.join("|")})(?![\\p{L}])`, "giu");

/** Quantities, units and temperatures exactly as written in `text`. */
export function extractCriticalTokens(text) {
  const temperatures = text.match(TEMPERATURE) ?? [];
  const withoutTemperatures = text.replace(TEMPERATURE, " ");
  const quantities = (withoutTemperatures.match(QUANTITY) ?? []).map((q) => q.replace(/\s+/g, " "));
  const units = text.match(UNIT) ?? [];
  return { quantities, units, temperatures };
}

function codePoints(text) {
  return Array.from(text);
}

function levenshtein(a, b) {
  const x = codePoints(a);
  const y = codePoints(b);
  let previous = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i++) {
    const row = [i];
    for (let j = 1; j <= y.length; j++) {
      row[j] = Math.min(
        previous[j] + 1,
        row[j - 1] + 1,
        previous[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1),
      );
    }
    previous = row;
  }
  return previous[y.length];
}

function normalisedDistance(a, b) {
  const longest = Math.max(codePoints(a).length, codePoints(b).length, 1);
  return levenshtein(a, b) / longest;
}

// Lines further apart than this are treated as different lines, not as a correction.
const SAME_LINE_LIMIT = 0.6;

/** One-to-one pairing of expected and actual lines, closest first. */
function pairLines(expected, actual) {
  const candidates = [];
  expected.forEach((e, i) => {
    actual.forEach((a, j) => {
      const distance = normalisedDistance(e, a);
      if (distance <= SAME_LINE_LIMIT) candidates.push({ i, j, distance });
    });
  });
  candidates.sort((p, q) => p.distance - q.distance || p.i - q.i || p.j - q.j);

  const usedExpected = new Set();
  const usedActual = new Set();
  const pairs = [];
  for (const candidate of candidates) {
    if (usedExpected.has(candidate.i) || usedActual.has(candidate.j)) continue;
    usedExpected.add(candidate.i);
    usedActual.add(candidate.j);
    pairs.push(candidate);
  }
  return {
    pairs,
    missing: expected.length - pairs.length,
    extra: actual.length - pairs.length,
  };
}

function scoreLines(expected, actual) {
  const { pairs, missing, extra } = pairLines(expected, actual);
  const changed = pairs.filter((pair) => pair.distance > 0).length;

  // Pairs that cross each other mean two lines swapped places.
  const byExpected = [...pairs].sort((p, q) => p.i - q.i);
  let orderErrors = 0;
  for (let a = 0; a < byExpected.length; a++) {
    for (let b = a + 1; b < byExpected.length; b++) {
      if (byExpected[a].j > byExpected[b].j) orderErrors++;
    }
  }
  return { edits: changed + missing + extra, changed, missing, extra, orderErrors };
}

function countMissing(expectedTokens, actualTokens) {
  const remaining = new Map();
  for (const token of actualTokens) remaining.set(token, (remaining.get(token) ?? 0) + 1);
  let missing = 0;
  for (const token of expectedTokens) {
    const left = remaining.get(token) ?? 0;
    if (left > 0) remaining.set(token, left - 1);
    else missing++;
  }
  return missing;
}

/**
 * How much a person would have to correct. `expected` and `actual` are
 * { title, ingredients: string[], steps: string[] }.
 */
export function scoreDraft(expected, actual) {
  const titleDistance = levenshtein(expected.title, actual.title);
  const ingredients = scoreLines(expected.ingredients, actual.ingredients);
  const steps = scoreLines(expected.steps, actual.steps);

  const expectedTokens = extractCriticalTokens([...expected.ingredients, ...expected.steps].join("\n"));
  const actualTokens = extractCriticalTokens([...actual.ingredients, ...actual.steps].join("\n"));
  const parts = {
    quantities: countMissing(expectedTokens.quantities, actualTokens.quantities),
    units: countMissing(expectedTokens.units, actualTokens.units),
    temperatures: countMissing(expectedTokens.temperatures, actualTokens.temperatures),
    stepOrder: steps.orderErrors,
  };
  const critical = {
    ...parts,
    total: parts.quantities + parts.units + parts.temperatures + parts.stepOrder,
  };

  return {
    title: { distance: titleDistance, normalised: normalisedDistance(expected.title, actual.title) },
    ingredients,
    steps,
    critical,
    totalEdits: (titleDistance > 0 ? 1 : 0) + ingredients.edits + steps.edits,
  };
}
