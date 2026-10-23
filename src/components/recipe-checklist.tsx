"use client";

import { useState } from "react";

type Labels = {
  ingredientsHeading: string;
  stepsHeading: string;
  tickHint: string;
  stepHint: string;
  currentStep: string;
};

/**
 * Ingredients you can tick off and steps you can mark as "doing now" while cooking.
 * Both live only in this page view: nothing is stored, and the recipe text is rendered
 * exactly as saved (D-11).
 */
export function RecipeChecklist({
  ingredients,
  steps,
  labels,
}: {
  ingredients: string[];
  steps: string[];
  labels: Labels;
}) {
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  return (
    <>
      {ingredients.length > 0 ? (
        <section className="space-y-2">
          <div>
            <h2 className="text-xl font-bold text-primary">{labels.ingredientsHeading}</h2>
            <p className="font-hand text-lg leading-tight text-muted-foreground">
              {labels.tickHint}
            </p>
          </div>
          <ul role="list" className="recipe-ingredients">
            {ingredients.map((line, index) => (
              <li key={index}>
                <label>
                  <input type="checkbox" />
                  <span className="break-words whitespace-pre-wrap">{line}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {steps.length > 0 ? (
        <section className="space-y-2">
          <div>
            <h2 className="text-xl font-bold text-primary">{labels.stepsHeading}</h2>
            <p className="font-hand text-lg leading-tight text-muted-foreground">
              {labels.stepHint}
            </p>
          </div>
          <ol role="list" className="recipe-steps space-y-1">
            {steps.map((step, index) => (
              <li key={index}>
                <button
                  type="button"
                  aria-pressed={currentStep === index}
                  data-current-label={labels.currentStep}
                  onClick={() => setCurrentStep((current) => (current === index ? null : index))}
                  className="break-words whitespace-pre-wrap"
                >
                  {step}
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </>
  );
}
