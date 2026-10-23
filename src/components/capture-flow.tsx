"use client";

import { useEffect, useRef, useState } from "react";

import { PhotoPicker, type PickedPhoto } from "@/components/photo-picker";
import { RecipeForm } from "@/components/recipe-form";
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

type CaptureFlowProps = {
  locale: Locale;
  cookbookId: string;
  recipeId: string;
  recipes: Dictionary["recipes"];
  capture: Dictionary["capture"];
};

/**
 * Capture screen and the recipe form it leads to. Both stay mounted so going back keeps what
 * was typed; the chosen photos live only in this component until the member saves (D-09).
 */
export function CaptureFlow({ locale, cookbookId, recipeId, recipes, capture }: CaptureFlowProps) {
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [typed, setTyped] = useState(false);
  const [step, setStep] = useState<"capture" | "manual">("capture");
  const hydrated = useHydrated();
  const guard = useLeaveGuard(photos.length > 0 || typed);

  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  useEffect(() => () => latest.current.forEach((photo) => URL.revokeObjectURL(photo.url)), []);

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

      <section hidden={step !== "capture"} className="space-y-6">
        <h1 className="text-3xl font-bold">{capture.title}</h1>
        {/* Choosing before hydration would be lost, so stay inert until React controls the page. */}
        <fieldset disabled={!hydrated} className="paper-panel min-w-0 space-y-4">
          <p className="text-base text-muted-foreground">{capture.hint}</p>
          <PhotoPicker photos={photos} onChange={setPhotos} labels={capture} />
          <div>
            <Button
              type="button"
              variant="link"
              className="h-11 px-0 underline"
              onClick={() => setStep("manual")}
            >
              {capture.skip}
            </Button>
          </div>
        </fieldset>
      </section>

      <section hidden={step !== "manual"} className="space-y-6">
        <Button
          type="button"
          variant="link"
          className="h-11 px-0 underline"
          onClick={() => setStep("capture")}
        >
          {capture.backToPhotos}
        </Button>
        <h1 className="text-3xl font-bold">{capture.manualHeading}</h1>
        <div className="paper-panel">
          <RecipeForm
            mode="create"
            recipeId={recipeId}
            initial={{ title: "", ingredients: [], steps: [] }}
            locale={locale}
            labels={recipes}
            photos={photos}
            cookbookId={cookbookId}
            uploadLabels={capture}
            onDirtyChange={setTyped}
          />
        </div>
      </section>
    </>
  );
}
