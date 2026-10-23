"use client";

import { ArrowDown, ArrowUp, ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import type { Dictionary } from "@/i18n/dictionaries";
import { MAX_PHOTOS } from "@/lib/photos/limits";
import { prepareJpeg } from "@/lib/photos/resize";

export type PickedPhoto = {
  id: string;
  url: string;
  /** Present for photos chosen in this session; saved photos are shown from their URL. */
  blob?: Blob;
  existing?: boolean;
};

type Problem = "tooMany" | "unsupported" | "prepareFailed";

const fill = (template: string, n: number) => template.replace("{n}", String(n));

type PhotoPickerProps = {
  photos: PickedPhoto[];
  onChange: Dispatch<SetStateAction<PickedPhoto[]>>;
  labels: Dictionary["capture"];
  /** Overrides the empty-state copy (the edit form has its own wording). */
  empty?: { heading: string; body: string };
  /** When set, removing a saved photo asks first. */
  removeLabels?: Dictionary["photos"]["remove"];
  /** Whether "Add photos" is the screen's primary action while empty (not inside a form). */
  primaryWhenEmpty?: boolean;
};

/**
 * Chooses and orders the photos of one recipe. Files are decoded and resized here in the browser;
 * nothing leaves the device until the member saves (D-09).
 */
export function PhotoPicker({
  photos,
  onChange,
  labels,
  empty,
  removeLabels,
  primaryWhenEmpty = true,
}: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(0);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [pendingRemoval, setPendingRemoval] = useState<number | null>(null);

  async function addFiles(files: File[]) {
    setProblems([]);
    setPreparing(files.length);
    const found = new Set<Problem>();
    // The add button is disabled while files are prepared, so this count only grows from here.
    let count = photos.length;

    for (const file of files) {
      if (count >= MAX_PHOTOS) {
        found.add("tooMany");
        break;
      }
      const result = await prepareJpeg(file);
      setPreparing((current) => current - 1);
      if (result.ok) {
        count += 1;
        const photo = {
          id: crypto.randomUUID(),
          blob: result.blob,
          url: URL.createObjectURL(result.blob),
        };
        onChange((current) => [...current, photo]);
      } else {
        found.add(result.reason === "unsupported" ? "unsupported" : "prepareFailed");
      }
    }

    setPreparing(0);
    setProblems([...found]);
  }

  const move = (from: number, to: number) => {
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const removeAt = (index: number) => {
    const photo = photos[index];
    if (photo.blob) URL.revokeObjectURL(photo.url);
    onChange(photos.filter((_, i) => i !== index));
    setProblems([]);
  };

  const remove = (index: number) => {
    if (removeLabels && photos[index].existing) setPendingRemoval(index);
    else removeAt(index);
  };

  const full = photos.length >= MAX_PHOTOS;
  const noPhotos = photos.length === 0 && preparing === 0;

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="photo-input"
        onChange={(event) => {
          const input = event.target;
          const files = Array.from(input.files ?? []);
          // Clearing the input only after the files are read keeps WebKit from invalidating them.
          if (files.length > 0) void addFiles(files).finally(() => (input.value = ""));
        }}
      />

      {problems.map((problem) => (
        <Alert key={problem} variant="destructive">
          <AlertDescription>{labels[problem]}</AlertDescription>
        </Alert>
      ))}

      {noPhotos ? (
        <div className="space-y-2 rounded-md border border-dashed bg-muted p-6 text-center">
          <h2 className="text-lg font-semibold">{empty?.heading ?? labels.emptyHeading}</h2>
          <p className="text-base text-muted-foreground">{empty?.body ?? labels.emptyBody}</p>
        </div>
      ) : (
        <ol aria-label={labels.photosList} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo, index) => {
            const n = index + 1;
            return (
              <li key={photo.id} className="space-y-2" data-photo-id={photo.id}>
                {/* Blob previews cannot use next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={fill(labels.previewAlt, n)}
                  className="aspect-[3/4] w-full rounded-md bg-muted object-cover"
                />
                <p className="text-sm">{fill(labels.pageLabel, n)}</p>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="size-11"
                    aria-label={fill(labels.moveUp, n)}
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="size-11"
                    aria-label={fill(labels.moveDown, n)}
                    disabled={index === photos.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="size-11"
                    aria-label={fill(labels.removePage, n)}
                    onClick={() => remove(index)}
                  >
                    <X aria-hidden />
                  </Button>
                </div>
              </li>
            );
          })}
          {Array.from({ length: preparing }, (_, i) => (
            <li
              key={`preparing-${i}`}
              className="flex aspect-[3/4] items-center justify-center gap-2 rounded-md bg-muted text-sm"
            >
              <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
              {labels.preparing}
            </li>
          ))}
        </ol>
      )}

      <Button
        type="button"
        variant={photos.length === 0 && primaryWhenEmpty ? "default" : "outline"}
        className="h-11 w-full sm:w-auto"
        disabled={full || preparing > 0}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus aria-hidden />
        {labels.addPhotos}
      </Button>

      {removeLabels ? (
        <AlertDialog
          open={pendingRemoval !== null}
          onOpenChange={(open) => !open && setPendingRemoval(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {fill(removeLabels.title, (pendingRemoval ?? 0) + 1)}
              </AlertDialogTitle>
              <AlertDialogDescription>{removeLabels.body}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11">{removeLabels.keep}</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive", className: "h-11" })}
                onClick={() => {
                  if (pendingRemoval !== null) removeAt(pendingRemoval);
                }}
              >
                {removeLabels.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
