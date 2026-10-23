"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries";
import { photoUrl } from "@/lib/photos/paths";

const fill = (template: string, values: Record<string, number>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, String(value)), template);

type PhotoGalleryProps = {
  recipeId: string;
  photoIds: string[];
  labels: Dictionary["photos"];
};

/** The original photos of a saved recipe, in page order, with a full-size viewer. */
export function PhotoGallery({ recipeId, photoIds, labels }: PhotoGalleryProps) {
  const [open, setOpen] = useState<number | null>(null);
  const total = photoIds.length;
  const current = open ?? 0;

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{labels.heading}</h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photoIds.map((photoId, index) => (
          <li key={photoId}>
            <button
              type="button"
              className="block w-full rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onClick={() => setOpen(index)}
            >
              {/* Served by the membership-checked route; next/image would bypass that check. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl(recipeId, photoId)}
                alt={fill(labels.alt, { n: index + 1, total })}
                data-photo-id={photoId}
                className="aspect-[3/4] w-full rounded-md bg-muted object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{fill(labels.caption, { n: current + 1, total })}</DialogTitle>
            <DialogDescription className="sr-only">{labels.heading}</DialogDescription>
          </DialogHeader>
          {open !== null ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl(recipeId, photoIds[current])}
              alt={fill(labels.alt, { n: current + 1, total })}
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          ) : null}
          <DialogFooter className="items-center sm:justify-between">
            {total > 1 ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="size-11"
                  aria-label={labels.previous}
                  disabled={current === 0}
                  onClick={() => setOpen(current - 1)}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="size-11"
                  aria-label={labels.next}
                  disabled={current === total - 1}
                  onClick={() => setOpen(current + 1)}
                >
                  <ChevronRight aria-hidden />
                </Button>
              </div>
            ) : (
              <span />
            )}
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-11">
                {labels.close}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
