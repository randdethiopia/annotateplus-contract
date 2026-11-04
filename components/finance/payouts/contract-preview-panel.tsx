"use client";

import { useState } from "react";
import { ArrowUpRight, FileWarning, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { financeApi } from "@/lib/api/finance.api";
import { useBlobUrl } from "@/lib/api/use-blob-url";
import { describeError } from "@/lib/describe-error";
import { useFinanceDocument } from "@/lib/hooks/use-finance";

const FRAME = "border-border w-full rounded-xl border bg-white shadow-xs";

export function ContractPreviewPanel({
  token,
  contractId,
  contractNumber,
}: {
  token: string;
  contractId: string;
  contractNumber: string;
}) {
  const sealed = useFinanceDocument(token, contractId);
  const blob = useBlobUrl(sealed.data?.documentUrl ?? null, undefined, "application/pdf");
  const [isOpening, setIsOpening] = useState(false);

  const isMissing = sealed.error instanceof ApiError && sealed.error.status === 404;

  async function openInNewTab() {
    // Opened synchronously inside the click so pop-up blockers allow it; the
    // signed URL is only known after the request resolves.
    const tab = window.open("", "_blank");
    if (!tab) {
      toast.error("Allow pop-ups for this site to open the contract document");
      return;
    }
    tab.opener = null;
    setIsOpening(true);
    try {
      const { documentUrl } = await financeApi.getSealedDocument(token, contractId);
      tab.location.href = documentUrl;
    } catch (err) {
      tab.close();
      toast.error(describeError(err, "Could not open the contract document"));
    } finally {
      setIsOpening(false);
    }
  }

  if (sealed.isError || blob.error) {
    return (
      <div className={`${FRAME} flex flex-col items-center px-6 py-14 text-center`}>
        <span
          className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
          aria-hidden
        >
          <FileWarning className="size-5" />
        </span>
        <p className="text-sm font-semibold text-slate-900">
          {isMissing ? "Contract archive not available yet" : "Inline preview unavailable"}
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-pretty text-slate-500">
          {isMissing
            ? "Signed legal contract document is pending archive generation for this sandbox contract."
            : "The sealed PDF could not be rendered here. You can still open the original document in a new tab."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              blob.retry();
              void sealed.refetch();
            }}
          >
            <RotateCcw aria-hidden />
            Try again
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void openInNewTab()}
            disabled={isOpening}
          >
            {isOpening ? (
              <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <ArrowUpRight aria-hidden />
            )}
            Open Contract Document
          </Button>
        </div>
      </div>
    );
  }

  if (!blob.url) {
    return (
      <div className={`${FRAME} flex h-[600px] items-center justify-center`}>
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="size-6 animate-spin text-slate-900 motion-reduce:animate-none" aria-hidden />
          <p className="text-xs font-medium">Loading sealed contract…</p>
        </div>
      </div>
    );
  }

  return (
    <iframe src={blob.url} className={`${FRAME} h-[700px]`} title={`Sealed contract ${contractNumber}`} />
  );
}
