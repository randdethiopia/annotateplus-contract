"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function IdCardLightbox({
  open,
  onOpenChange,
  imageUrl,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-0 p-2 sm:p-4">
        <DialogHeader className="px-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="mx-auto max-h-[80vh] w-full rounded-lg object-contain"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
