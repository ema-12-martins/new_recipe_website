"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState, useSyncExternalStore } from "react";

import {
  createRecipeAction,
  updateRecipeAction,
  type RecipeFormState,
} from "@/app/[locale]/(app)/recipes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useOnlineStatus } from "@/lib/offline/use-online-status";
import type { RecipeFormValues } from "@/lib/recipes/schema";

type Line = { key: number; text: string };

const fill = (template: string, n: number) => template.replace("{n}", String(n));

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true once React controls the form. */
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export type RecipeFormProps = {
  recipeId: string;
  initial: RecipeFormValues;
  locale: Locale;
  labels: Dictionary["recipes"];
} & ({ mode: "create" } | { mode: "edit"; version: number });

export function RecipeForm(props: RecipeFormProps) {
  const { recipeId, initial, locale, labels } = props;
  const [state, formAction, pending] = useActionState<RecipeFormState, FormData>(
    props.mode === "create" ? createRecipeAction : updateRecipeAction,
    {},
  );

  // Keys only identify rows for React; they are never rendered into the markup.
  const nextKey = useRef(initial.ingredients.length + initial.steps.length + 2);
  const toLines = (texts: string[], offset: number): Line[] =>
    (texts.length > 0 ? texts : [""]).map((text, index) => ({ key: offset + index, text }));

  const [title, setTitle] = useState(initial.title);
  const [ingredients, setIngredients] = useState<Line[]>(() => toLines(initial.ingredients, 0));
  const [steps, setSteps] = useState<Line[]>(() =>
    toLines(initial.steps, initial.ingredients.length + 1),
  );

  const newLine = (): Line => ({ key: nextKey.current++, text: "" });
  const setText = (lines: Line[], index: number, text: string) =>
    lines.map((line, i) => (i === index ? { ...line, text } : line));
  const moveStep = (from: number, to: number) =>
    setSteps((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  const { form } = labels;
  const hydrated = useHydrated();
  const isOnline = useOnlineStatus();

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={recipeId} />
      {props.mode === "edit" ? <input type="hidden" name="version" value={props.version} /> : null}

      {/* Text typed before hydration would be replaced by React state, so stay inert until then. */}
      <fieldset disabled={!hydrated} className="min-w-0 space-y-8">
        {state.status === "conflict" ? (
          <div
            role="alert"
            className="space-y-2 rounded-md border border-destructive/50 p-4 text-sm text-destructive"
          >
            <p>{labels.errors.conflict}</p>
            <Link
              href={`/${locale}/recipes/${recipeId}/edit`}
              className="inline-block py-2 font-medium underline underline-offset-4"
            >
              {labels.errors.reloadLatest}
            </Link>
          </div>
        ) : null}

        {state.errors?.form ? (
          <p role="alert" className="text-sm text-destructive">
            {state.errors.form}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="title">{form.title}</Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={state.errors?.title ? true : undefined}
            aria-describedby={state.errors?.title ? "title-error" : undefined}
            className="h-11"
            required
          />
          {state.errors?.title ? (
            <p id="title-error" role="alert" className="text-sm text-destructive">
              {state.errors.title}
            </p>
          ) : null}
        </div>

        <fieldset className="min-w-0 space-y-3">
          <legend className="text-base font-medium">{form.ingredients}</legend>
          <p className="text-sm text-muted-foreground">{form.ingredientsHint}</p>
          {state.errors?.ingredients ? (
            <p role="alert" className="text-sm text-destructive">
              {state.errors.ingredients}
            </p>
          ) : null}
          <ol className="space-y-2">
            {ingredients.map((line, index) => (
              <li key={line.key} className="flex items-center gap-2">
                <Input
                  name="ingredients[]"
                  value={line.text}
                  onChange={(event) =>
                    setIngredients((current) => setText(current, index, event.target.value))
                  }
                  aria-label={fill(form.ingredientLine, index + 1)}
                  className="h-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="size-11"
                  aria-label={fill(form.removeIngredient, index + 1)}
                  onClick={() => setIngredients((current) => current.filter((_, i) => i !== index))}
                >
                  <X aria-hidden />
                </Button>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => setIngredients((current) => [...current, newLine()])}
          >
            <Plus aria-hidden />
            {form.addIngredient}
          </Button>
        </fieldset>

        <fieldset className="min-w-0 space-y-3">
          <legend className="text-base font-medium">{form.steps}</legend>
          {state.errors?.steps ? (
            <p role="alert" className="text-sm text-destructive">
              {state.errors.steps}
            </p>
          ) : null}
          <ol className="space-y-4">
            {steps.map((line, index) => {
              const n = index + 1;
              const fieldId = `step-${line.key}`;
              return (
                <li key={line.key} className="space-y-2">
                  <Label htmlFor={fieldId}>{fill(form.stepLabel, n)}</Label>
                  <Textarea
                    id={fieldId}
                    name="steps[]"
                    value={line.text}
                    onChange={(event) =>
                      setSteps((current) => setText(current, index, event.target.value))
                    }
                    className="min-h-20"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="size-11"
                      aria-label={fill(form.moveStepUp, n)}
                      disabled={index === 0}
                      onClick={() => moveStep(index, index - 1)}
                    >
                      <ArrowUp aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="size-11"
                      aria-label={fill(form.moveStepDown, n)}
                      disabled={index === steps.length - 1}
                      onClick={() => moveStep(index, index + 1)}
                    >
                      <ArrowDown aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="size-11"
                      aria-label={fill(form.removeStep, n)}
                      onClick={() => setSteps((current) => current.filter((_, i) => i !== index))}
                    >
                      <X aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => setSteps((current) => [...current, newLine()])}
          >
            <Plus aria-hidden />
            {form.addStep}
          </Button>
        </fieldset>

        {!isOnline ? (
          <p className="text-sm text-muted-foreground">{form.editingNeedsConnection}</p>
        ) : null}
        <Button type="submit" disabled={pending || !isOnline} className="h-11 w-full sm:w-auto">
          {form.save}
        </Button>
      </fieldset>
    </form>
  );
}
