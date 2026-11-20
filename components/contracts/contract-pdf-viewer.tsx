"use client";

import { AlertTriangle, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBlobUrl } from "@/lib/api/use-blob-url";
import { AGREEMENT_PAGE_COUNT } from "@/lib/contract-content";
import { cn } from "@/lib/utils";

const FRAME = "border border-slate-200 rounded-lg overflow-hidden";

export function ContractPdfViewer({
  token,
  className,
  title = "Agreement document",
  openLabel = "Tap to read the agreement",
}: {
  token: string;
  className?: string;
  title?: string;
  openLabel?: string;
}) {
  const { url, isLoading, error } = useBlobUrl("/worker/me/document", token);

  if (isLoading) {
    return (
      <div
        className={cn(
          FRAME,
          "flex min-h-[50vh] flex-col items-center justify-center gap-3",
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
          "border-destructive flex items-start gap-3 border-l-2 py-1 pl-4 text-sm",
          className
        )}
        role="alert"
      >
        <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold text-slate-900">Could not load the agreement document.</p>
          <p className="mt-1 text-slate-600">
            {error?.message ?? "Please refresh the page or contact HR for assistance."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Below sm the agreement is a compact card that opens full-screen. A 70vh
          iframe stacked above a long form is punishing on a phone, and iOS Safari
          renders PDFs in an iframe poorly anyway. */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          FRAME,
          "focus-visible:ring-ring/50 flex min-h-16 items-center gap-3 p-4 transition-colors outline-none hover:bg-slate-100 focus-visible:ring-[3px] sm:hidden",
          className
        )}
      >
        <FileText className="size-5 shrink-0 text-slate-900" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">{openLabel}</span>
          <span className="block truncate text-xs text-slate-500">
            {title} · {AGREEMENT_PAGE_COUNT} pages · PDF
          </span>
        </span>
        <ExternalLink className="text-action size-4 shrink-0" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>

      <div className={cn("hidden sm:block", className)}>
        <div className="flex items-center justify-between gap-3 pb-3">
          <p className="min-w-0 truncate text-sm font-medium text-slate-600">
            Official Task-Based Worker Agreement ({AGREEMENT_PAGE_COUNT} Pages)
          </p>
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
        <div className={FRAME}>
          <iframe
            src={url}
            title="Employment agreement"
            className="h-[70vh] max-h-[75vh] min-h-[65vh] w-full border-0"
          />
        </div>
        <p className="px-1 pt-2.5 text-xs text-slate-500">
          Scroll to read all pages. Trouble viewing it here? Use{" "}
          <span className="font-medium text-slate-900">Open</span> above.
        </p>
      </div>
    </>
  );
}
