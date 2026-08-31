"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Camera, ImageUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MIN_IMAGE_DIMENSION = 300;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Off-DOM decode so we can reject unreadable or too-small photos before upload. */
function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Full client-side gate for a Fayda ID photo. Returns an error message, or null
 * when the file is acceptable. Runs at pick time so the candidate finds out
 * immediately rather than after a failed submit.
 */
export async function validateIdPhoto(file: File): Promise<string | null> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a JPEG, PNG, or WebP photo.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Photo must be 10MB or smaller — this one is ${formatBytes(file.size)}.`;
  }
  const dimensions = await readImageDimensions(file);
  if (!dimensions) {
    return "That file could not be read as an image. Please retake the photo.";
  }
  if (dimensions.width < MIN_IMAGE_DIMENSION || dimensions.height < MIN_IMAGE_DIMENSION) {
    return `Photo is too small to verify (${dimensions.width}×${dimensions.height}). Please retake it — at least ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION} pixels.`;
  }
  return null;
}

export function IdPhotoField({
  id,
  label,
  labelAmharic,
  hint,
  value,
  onChange,
  error,
  disabled,
}: {
  id: string;
  label: string;
  labelAmharic?: string;
  hint?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Preview follows the file, and the object URL is released when it changes.
  // Object URLs are an external resource with its own lifecycle, so creating and
  // revoking them belongs in an effect — same pattern (and same lint exemption)
  // as lib/api/use-blob-url.ts.
  useEffect(() => {
    if (!value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  async function acceptFile(file: File) {
    setIsChecking(true);
    const message = await validateIdPhoto(file);
    setIsChecking(false);
    if (message) {
      setLocalError(message);
      onChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setLocalError(null);
    onChange(file);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void acceptFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void acceptFile(file);
  }

  function handleRemove() {
    setLocalError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const shownError = localError ?? error;
  const describedBy = shownError ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    // Wrapper id matches <Field>: the real input is sr-only, so the form's
    // scroll-to-first-error targets this box rather than the control.
    <div id={`field-${id}`} className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
          <span className="text-destructive ml-0.5" aria-hidden>
            *
          </span>
        </Label>
        {labelAmharic && (
          <span className="font-ethiopic text-muted-foreground text-xs">{labelAmharic}</span>
        )}
      </div>

      {/*
        Deliberately no `capture` attribute. Setting it pins iOS Safari and
        Android Chrome straight to the camera, so a candidate who already
        photographed their Fayda ID — or received it from someone else — cannot
        reach it, despite the dropzone offering the gallery. `accept` alone still
        narrows the OS sheet to photos while keeping Camera, Photo Library and
        Files all reachable.
      */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        disabled={disabled}
        aria-invalid={!!shownError}
        aria-describedby={describedBy}
        onChange={handleInputChange}
      />

      {value && previewUrl ? (
        <div className="bg-card overflow-hidden rounded-2xl shadow-xs">
          <div className="bg-surface-subtle flex items-center justify-center p-2">
            {/* Blob URL from the local file — next/image cannot optimize it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="max-h-56 w-full rounded-xl object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-foreground truncate text-xs font-medium">{value.name}</p>
              <p className="text-muted-foreground text-xs">{formatBytes(value.size)}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
              >
                <RefreshCw className="size-3.5" />
                Replace
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={`Remove ${label}`}
                disabled={disabled}
                onClick={handleRemove}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled) inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={cn(
            "focus-visible:ring-ring flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            disabled && "pointer-events-none opacity-60",
            shownError
              ? "border-destructive/40 bg-destructive-soft"
              : isDragging
                ? "border-action bg-action-soft"
                : "border-border bg-surface-subtle hover:border-action/60 hover:bg-action-soft/50"
          )}
        >
          {isChecking ? (
            <>
              <Loader2 className="text-action size-6 animate-spin" aria-hidden />
              <span className="text-muted-foreground text-sm">Checking photo…</span>
            </>
          ) : (
            <>
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full",
                  shownError ? "bg-destructive/10 text-destructive" : "bg-action-soft text-action"
                )}
                aria-hidden
              >
                <Camera className="size-5" />
              </span>
              <span className="text-foreground text-sm font-medium">
                Tap to take a photo
              </span>
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                <ImageUp className="size-3.5" aria-hidden />
                or choose from your gallery
              </span>
            </>
          )}
        </div>
      )}

      {shownError ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-xs font-medium">
          {shownError}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
