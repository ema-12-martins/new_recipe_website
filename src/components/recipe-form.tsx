"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";

import {
  createRecipeAction,
  updateRecipeAction,
  type RecipeFormState,
} from "@/app/[locale]/(app)/recipes/actions";
import { PhotoPicker, type PickedPhoto } from "@/components/photo-picker";
import { useHydrated } from "@/components/use-hydrated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useOnlineStatus } from "@/lib/offline/use-online-status";
import { photoUrl } from "@/lib/photos/paths";
import { uploadPhotos } from "@/lib/photos/upload";
import type { RecipeFormValues } from "@/lib/recipes/schema";

type Line = { key: number; text: string };

const fill = (template: string, n: number) => template.replace("{n}", String(n));

const FIXED_FIELDS = new Set(["locale", "id", "version", "photoIds", "photoOrder", "photoChanges"]);

/** True when any text field holds something other than whitespace. */
function hasTypedText(form: HTMLFormElement): boolean {
  return Array.from(new FormData(form).entries()).some(
    ([name, value]) => !FIXED_FIELDS.has(name) && typeof value === "string" && value.trim() !== "",
  );
}

export type RecipeFormProps = {
  recipeId: string;
  initial: RecipeFormValues;
  locale: Locale;
  labels: Dictionary["recipes"];
  /** Reports whether the member has typed anything, so the page can warn before leaving. */
  onDirtyChange?: (dirty: boolean) => void;
} & (
  | {
      mode: "create";
      /** Photos chosen on the capture screen; uploaded only when the member saves. */
      photos?: PickedPhoto[];
      cookbookId?: string;
      uploadLabels?: Pick<Dictionary["capture"], "uploading" | "uploadFailed">;
    }
  | {
      mode: "edit";
      version: number;
      cookbookId: string;
      /** Ids of the photos the recipe already has, in page order. */
      initialPhotoIds: string[];
      captureLabels: Dictionary["capture"];
      photoLabels: Dictionary["photos"];
    }
);

export function RecipeForm(props: RecipeFormProps) {
  const { recipeId, initial, locale, labels } = props;
  const [state, formAction, pending] = useActionState<RecipeFormState, FormData>(
    props.mode === "create" ? createRecipeAction : updateRecipeAction,
    {},
  );
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [, startTransition] = useTransition();
  const [editPhotos, setEditPhotos] = useState<PickedPhoto[]>(() =>
    props.mode === "edit"
      ? props.initialPhotoIds.map((id) => ({ id, url: photoUrl(recipeId, id), existing: true }))
      : [],
  );
  const photos = props.mode === "create" ? props.photos : editPhotos;
  const cookbookId = props.cookbookId;
  const uploadLabels = props.mode === "create" ? props.uploadLabels : props.captureLabels;

  /** New photos are uploaded first; the recipe is saved only once every file is stored. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const fresh = (photos ?? []).flatMap((photo) =>
      photo.blob ? [{ id: photo.id, blob: photo.blob }] : [],
    );
    if (fresh.length === 0 || !cookbookId) return;
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setUploadFailed(false);
    setUploading(true);
    const stored = await uploadPhotos(cookbookId, recipeId, fresh);
    setUploading(false);
    if (!stored) {
      setUploadFailed(true);
      return;
    }
    startTransition(() => formAction(formData));
  }

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
    <form
      action={formAction}
      onSubmit={handleSubmit}
      onInput={(event) => props.onDirtyChange?.(hasTypedText(event.currentTarget))}
      noValidate
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={recipeId} />
      {props.mode === "edit" ? <input type="hidden" name="version" value={props.version} /> : null}
      {props.mode === "create"
        ? photos?.map((photo) => (
            <input key={photo.id} type="hidden" name="photoIds" value={photo.id} />
          ))
        : (
          <>
            <input type="hidden" name="photoChanges" value="1" />
            {editPhotos.map((photo) => (
              <input key={photo.id} type="hidden" name="photoOrder" value={photo.id} />
            ))}
          </>
        )}

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

        {uploading && uploadLabels ? (
          <p role="status" className="text-sm text-muted-foreground">
            {uploadLabels.uploading}
          </p>
        ) : null}

        {uploadFailed && uploadLabels ? (
          <p role="alert" className="text-sm text-destructive">
            {uploadLabels.uploadFailed}
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

        {props.mode === "edit" ? (
          <fieldset className="min-w-0 space-y-3">
            <legend className="text-base font-semibold">{props.photoLabels.editHeading}</legend>
            <PhotoPicker
              photos={editPhotos}
              onChange={setEditPhotos}
              labels={props.captureLabels}
              empty={{
                heading: props.photoLabels.editEmptyHeading,
                body: props.photoLabels.editEmptyBody,
              }}
              removeLabels={props.photoLabels.remove}
            />
          </fieldset>
        ) : null}

        {!isOnline ? (
          <p className="text-sm text-muted-foreground">{form.editingNeedsConnection}</p>
        ) : null}
        <Button
          type="submit"
          disabled={pending || uploading || !isOnline}
          className="h-11 w-full sm:w-auto"
        >
          {form.save}
        </Button>
      </fieldset>
    </form>
  );
}
