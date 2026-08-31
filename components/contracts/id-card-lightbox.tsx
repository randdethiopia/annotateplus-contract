"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const SCALE_STEP = 0.4;

export function IdCardLightbox({
  open,
  onOpenChange,
  imageUrl,
  title,
  onPrev,
  onNext,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  title: string;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const reset = useCallback(() => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Every new image — and every reopen — starts from a clean view. Done during
  // render rather than in an effect so the first paint is never the stale zoom.
  const viewKey = `${imageUrl ?? ""}|${open}`;
  const [lastViewKey, setLastViewKey] = useState(viewKey);
  if (viewKey !== lastViewKey) {
    setLastViewKey(viewKey);
    reset();
  }

  const zoomBy = useCallback((delta: number) => {
    setScale((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta));
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "+" || e.key === "=") zoomBy(SCALE_STEP);
      else if (e.key === "-") zoomBy(-SCALE_STEP);
      else if (e.key === "r") setRotation((r) => (r + 90) % 360);
      else if (e.key === "0") reset();
      else if (e.key === "ArrowLeft") onPrev?.();
      else if (e.key === "ArrowRight") onNext?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, zoomBy, reset, onPrev, onNext]);

  function handlePointerDown(e: React.PointerEvent) {
    if (scale <= MIN_SCALE) return;
    dragState.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const start = dragState.current;
    if (!start) return;
    setOffset({ x: start.ox + (e.clientX - start.x), y: start.oy + (e.clientY - start.y) });
  }

  function handlePointerUp(e: React.PointerEvent) {
    dragState.current = null;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  const canNavigate = !!(onPrev || onNext);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl gap-3 border-0 p-3 sm:p-4">
        <DialogHeader className="flex-row items-center justify-between gap-3 space-y-0 pr-8">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Zoom out"
              disabled={scale <= MIN_SCALE}
              onClick={() => zoomBy(-SCALE_STEP)}
            >
              <Minus className="size-4" />
            </Button>
            <span className="text-muted-foreground w-12 text-center text-xs font-semibold tabular">
              {Math.round(scale * 100)}%
            </span>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Zoom in"
              disabled={scale >= MAX_SCALE}
              onClick={() => zoomBy(SCALE_STEP)}
            >
              <Plus className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Rotate 90 degrees"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Reset view"
              onClick={reset}
            >
              <Maximize2 className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        <div
          className={cn(
            "bg-surface-subtle relative overflow-hidden rounded-xl",
            scale > MIN_SCALE && (isDragging ? "cursor-grabbing" : "cursor-grab")
          )}
          onWheel={(e) => {
            if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 2) return;
            zoomBy(e.deltaY < 0 ? SCALE_STEP : -SCALE_STEP);
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={() => (scale > MIN_SCALE ? reset() : zoomBy(SCALE_STEP * 3))}
        >
          {imageUrl && (
            // Authenticated blob URL — next/image cannot optimize it.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              draggable={false}
              className="mx-auto max-h-[72vh] w-full touch-none object-contain select-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? "none" : "transform 150ms ease-out",
              }}
            />
          )}

          {canNavigate && (
            <>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Previous image"
                onClick={onPrev}
                disabled={!onPrev}
                className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full shadow-sm"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Next image"
                onClick={onNext}
                disabled={!onNext}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full shadow-sm"
              >
                <ChevronRight className="size-5" />
              </Button>
            </>
          )}
        </div>

        <p className="text-muted-foreground text-center text-xs">
          Scroll or pinch to zoom · drag to pan · double-click to reset ·{" "}
          <kbd className="bg-muted rounded px-1 font-sans">R</kbd> to rotate
          {canNavigate && (
            <>
              {" "}
              · <kbd className="bg-muted rounded px-1 font-sans">←</kbd>{" "}
              <kbd className="bg-muted rounded px-1 font-sans">→</kbd> to switch sides
            </>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
