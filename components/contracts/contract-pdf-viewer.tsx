"use client";

import { AlertTriangle, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBlobUrl } from "@/lib/api/use-blob-url";
import { AGREEMENT_PAGE_COUNT } from "@/lib/contract-content";
import { cn } from "@/lib/utils";

export function ContractPdfViewer({
  token,
  className,
  title = "Agreement document",
  openLabel = "Tap to read the agreement",
  openLabelAmharic,
}: {
  token: string;
  className?: string;
  /** Compact-card heading, shown below sm. Bilingual copy is passed in so it can
   *  stay in the signing portal's single copy file. */
  title?: string;
  openLabel?: string;
  openLabelAmharic?: string;
}) {
  const { url, isLoading, error } = useBlobUrl("/worker/me/document", token);

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-card flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl shadow-xs",
          className
        )}
      >
        <Loader2 className="text-action size-7 animate-spin" aria-hidden />
        <p className="text-muted-foreground text-sm">Loading your agreement…</p>
      </div>
    );
  }

  if (error || !url) {
    return (
      <div
        className={cn(
          "bg-destructive-soft rounded-2xl p-6 text-center text-sm shadow-xs",
          className
        )}
        role="alert"
      >
        <AlertTriangle className="text-destructive mx-auto mb-3 size-7" aria-hidden />
        <p className="text-foreground font-semibold">Could not load the agreement document.</p>
        <p className="text-muted-foreground mt-1">
          {error?.message ?? "Please refresh the page or contact HR for assistance."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Below sm the agreement is a compact card that opens full-screen. A 70vh
          iframe stacked above a long form is punishing on a phone, and iOS Safari
          renders PDFs in an iframe poorly anyway. */}
      <div className={cn("bg-card rounded-2xl p-4 shadow-xs sm:hidden", className)}>
        <div className="flex items-center gap-3">
          <span
            className="bg-action-soft text-action flex size-10 shrink-0 items-center justify-center rounded-xl"
            aria-hidden
          >
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-semibold">{title}</p>
            <p className="text-muted-foreground text-xs">{AGREEMENT_PAGE_COUNT} pages · PDF</p>
          </div>
        </div>
        <Button type="button" variant="outline" className="mt-3 h-12 w-full" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            {openLabel}
          </a>
        </Button>
        {openLabelAmharic && (
          <p className="font-ethiopic text-muted-foreground mt-2 text-center text-xs">
            {openLabelAmharic}
          </p>
        )}
      </div>

      <div
        className={cn(
          "bg-card hidden overflow-hidden rounded-2xl p-4 shadow-xs sm:block",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="text-action size-4 shrink-0" aria-hidden />
            <p className="text-foreground truncate text-sm font-semibold">
              Official Task-Based Worker Agreement ({AGREEMENT_PAGE_COUNT} Pages)
            </p>
          </div>
          {/*
            Mobile browsers — iOS Safari in particular — render PDFs inside an
            iframe poorly or not at all. On a mobile-first signing flow that is a
            blocker, not a cosmetic issue, so always offer the full-window route.
          */}
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              Open
            </a>
          </Button>
        </div>
        <div className="bg-surface-subtle overflow-hidden rounded-xl">
          <iframe
            src={url}
            title="Employment agreement"
            className="h-[70vh] max-h-[75vh] min-h-[65vh] w-full border-0"
          />
        </div>
        <p className="text-muted-foreground px-1 pt-2.5 text-xs">
          Scroll to read all pages. Trouble viewing it here? Use{" "}
          <span className="text-foreground font-medium">Open</span> above.
        </p>
      </div>
    </>
  );
}
