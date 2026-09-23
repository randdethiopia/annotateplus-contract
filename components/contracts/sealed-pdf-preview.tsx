"use client";

import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBlobUrl } from "@/lib/api/use-blob-url";
import { useFinanceDocument } from "@/lib/hooks/use-finance";

const FRAME_SHELL =
  "w-full rounded-xl border border-slate-200 bg-slate-50 shadow-xs";

function PreviewSkeleton() {
  return (
    <div className={`${FRAME_SHELL} flex h-[600px] items-center justify-center`}>
      <div className="flex flex-col items-center gap-2 text-slate-500">
        <Loader2 className="text-primary size-6 animate-spin" aria-hidden />
        <p className="text-xs font-medium">Loading official sealed PDF…</p>
      </div>
    </div>
  );
}

function PreviewError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className={`${FRAME_SHELL} flex h-[300px] flex-col items-center justify-center gap-3 px-6 text-center`}
    >
      <AlertTriangle className="size-5 shrink-0 text-amber-600" aria-hidden />
      <p className="text-muted-foreground max-w-sm text-sm">
        Could not load inline PDF preview. Please use the &ldquo;Download sealed PDF&rdquo;
        button above.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        <RotateCcw className="size-4" aria-hidden />
        Try again
      </Button>
    </div>
  );
}

export function SealedPdfPreview({
  contractId,
  token,
  contractNumber,
}: {
  contractId: string;
  token: string;
  contractNumber: string;
}) {
  const { data, isError, refetch } = useFinanceDocument(token, contractId);
  const {
    url,
    error: documentError,
    retry,
  } = useBlobUrl(data?.documentUrl ?? null, undefined, "application/pdf");

  if (isError || documentError) {
    return (
      <PreviewError
        onRetry={() => {
          retry();
          void refetch();
        }}
      />
    );
  }
  if (!url) return <PreviewSkeleton />;

  return (
    <iframe
      src={url}
      className={`${FRAME_SHELL} h-[700px]`}
      title={`Sealed Contract ${contractNumber}`}
    />
  );
}
