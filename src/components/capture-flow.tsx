"use client";

import { Loader2, ScanText, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PhotoPicker, type PickedPhoto } from "@/components/photo-picker";
import { RecipeForm } from "@/components/recipe-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useHydrated } from "@/components/use-hydrated";
import { useLeaveGuard } from "@/components/use-leave-guard";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useOnlineStatus } from "@/lib/offline/use-online-status";
import { readRecipe } from "@/lib/photos/read-recipe";
import type { RecipeFormValues } from "@/lib/recipes/schema";

type CaptureFlowProps = {
  locale: Locale;
  cookbookId: string;
  recipeId: string;
  recipes: Dictionary["recipes"];
  capture: Dictionary["capture"];
  recognition: Dictionary["recognition"];
  /** Read recipe is offered only when an approved provider is configured. */
  recognitionEnabled: boolean;
};

type Step = "capture" | "reading" | "failure" | "form";
type FormSource = { key: number; initial: RecipeFormValues; draft: boolean };

const EMPTY: RecipeFormValues = { title: "", ingredients: [], steps: [] };

/**
 * Capture screen, reading and failure states, and the recipe form (manual or pre-filled draft).
 * The chosen photos and any draft live only in this component until the member presses Save
 * (D-08, D-09); reading never stores anything (CAPT-03).
 */
export function CaptureFlow({
  locale,
  cookbookId,
  recipeId,
  recipes,
  capture,
  recognition,
  recognitionEnabled,
}: CaptureFlowProps) {
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [typed, setTyped] = useState(false);
  const [step, setStep] = useState<Step>("capture");
  const [form, setForm] = useState<FormSource>({ key: 0, initial: EMPTY, draft: false });
  const hydrated = useHydrated();
  const isOnline = useOnlineStatus();
  const guard = useLeaveGuard(photos.length > 0 || typed);
  const reading = useRef<AbortController | null>(null);
  const failureHeading = useRef<HTMLDivElement>(null);
  const draftHeading = useRef<HTMLDivElement>(null);

  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      reading.current?.abort();
      latest.current.forEach((photo) => URL.revokeObjectURL(photo.url));
    },
    [],
  );

  // Move focus to the new state's heading so screen readers announce it.
  useEffect(() => {
    if (step === "failure") failureHeading.current?.focus();
    if (step === "form" && form.draft) draftHeading.current?.focus();
  }, [step, form]);

  const blobs = photos.flatMap((photo) => (photo.blob ? [photo.blob] : []));
  const canRead = recognitionEnabled && blobs.length > 0 && blobs.length === photos.length;

  function openForm(initial: RecipeFormValues, draft: boolean) {
    setForm((current) => ({ key: current.key + 1, initial, draft }));
    setTyped(false);
    setStep("form");
  }

  /** Manual entry keeps whatever was already typed by hand; a draft is replaced by a blank form. */
  function enterManually() {
    if (form.draft) openForm(EMPTY, false);
    else setStep("form");
  }

  async function startReading() {
    const controller = new AbortController();
    reading.current = controller;
    setStep("reading");
    try {
      const result = await readRecipe(blobs, locale, controller.signal);
      if (controller.signal.aborted) return;
      if ("draft" in result) openForm(result.draft, true);
      else setStep("failure");
    } catch {
      if (!controller.signal.aborted) setStep("failure");
    } finally {
      if (reading.current === controller) reading.current = null;
    }
  }

  function stopReading() {
    reading.current?.abort();
    reading.current = null;
    setStep("capture");
  }

  function discardDraft() {
    openForm(EMPTY, false);
    setStep("capture");
  }

  const onPhotosStep = step === "capture" || step === "reading" || step === "failure";

  return (
    <>
      <AlertDialog open={guard.open} onOpenChange={(open) => !open && guard.stay()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{capture.leave.title}</AlertDialogTitle>
            <AlertDialogDescription>{capture.leave.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">{capture.leave.stay}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive", className: "h-11" })}
              onClick={guard.leave}
            >
              {capture.leave.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section hidden={!onPhotosStep} className="space-y-6">
        <h1 className="text-3xl font-bold">{capture.title}</h1>

        <div aria-live="polite">
          {step === "reading" ? (
            <Alert className="space-y-3">
              <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" />
              <AlertTitle className="font-display text-lg font-bold">
                {recognition.readingTitle}
              </AlertTitle>
              <AlertDescription className="text-base">
                <p>{recognition.readingHint}</p>
                <Button type="button" variant="outline" className="mt-2 h-11" onClick={stopReading}>
                  {recognition.stop}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        {step === "failure" ? (
          <Alert role="alert" className="space-y-3">
            <TriangleAlert aria-hidden />
            <AlertTitle
              ref={failureHeading}
              tabIndex={-1}
              className="font-display text-lg font-bold text-destructive outline-none"
            >
              {recognition.failureTitle}
            </AlertTitle>
            <AlertDescription className="text-base text-card-foreground">
              <p>{recognition.failureBody}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-11 w-full sm:w-auto"
                  disabled={!isOnline}
                  onClick={() => void startReading()}
                >
                  {recognition.tryAgain}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full sm:w-auto"
                  onClick={enterManually}
                >
                  {recognition.enterManually}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Choosing before hydration would be lost, so stay inert until React controls the page. */}
        <fieldset disabled={!hydrated || step === "reading"} className="paper-panel min-w-0 space-y-4">
          <p className="text-base text-muted-foreground">{capture.hint}</p>
          <PhotoPicker photos={photos} onChange={setPhotos} labels={capture} />
          {recognitionEnabled && photos.length > 0 && step !== "failure" ? (
            <div className="space-y-2">
              <Button
                type="button"
                className="h-11 w-full sm:w-auto"
                disabled={!canRead || !isOnline}
                onClick={() => void startReading()}
              >
                <ScanText aria-hidden />
                {recognition.read}
              </Button>
              {!isOnline ? (
                <p className="text-sm text-muted-foreground">{recognition.offline}</p>
              ) : null}
            </div>
          ) : null}
          <div>
            <Button type="button" variant="link" className="h-11 px-0 underline" onClick={enterManually}>
              {capture.skip}
            </Button>
          </div>
        </fieldset>
      </section>

      <section hidden={step !== "form"} className="space-y-6">
        <Button
          type="button"
          variant="link"
          className="h-11 px-0 underline"
          onClick={() => setStep("capture")}
        >
          {capture.backToPhotos}
        </Button>
        <h1 className="text-3xl font-bold">{capture.manualHeading}</h1>
        {form.draft ? (
          <Alert className="bg-secondary text-secondary-foreground">
            <ScanText aria-hidden />
            <AlertTitle
              ref={draftHeading}
              tabIndex={-1}
              className="font-display text-lg font-bold outline-none"
            >
              {recognition.draftTitle}
            </AlertTitle>
            <AlertDescription className="text-base text-secondary-foreground">
              {recognition.draftBody}
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="paper-panel">
          <RecipeForm
            key={form.key}
            mode="create"
            recipeId={recipeId}
            initial={form.initial}
            locale={locale}
            labels={recipes}
            photos={photos}
            cookbookId={cookbookId}
            uploadLabels={capture}
            onDirtyChange={setTyped}
          />
        </div>
        {form.draft ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={discardDraft}>
              {recognition.discardAndRetry}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={() => openForm(EMPTY, false)}
            >
              {recognition.enterManually}
            </Button>
          </div>
        ) : null}
      </section>
    </>
  );
}
