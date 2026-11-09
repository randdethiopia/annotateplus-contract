"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkJobSummaryModal } from "@/components/finance/bulk-job-summary-modal";
import { useAuth } from "@/lib/auth/auth-context";
import { describeError } from "@/lib/describe-error";
import { useBulkJobStatus } from "@/lib/hooks/use-finance";
import { cn } from "@/lib/utils";

const SETTLED_INVALIDATION_KEYS = [
  ["contracts"],
  ["candidates"],
  ["finance-contracts"],
  ["finance-kpis"],
  ["finance-summary"],
];

export interface BulkJobPillProps {
  jobId: string;
  onDismiss: () => void;
}

export function BulkJobPill({ jobId, onDismiss }: BulkJobPillProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const { data, error } = useBulkJobStatus(token ?? "", jobId, true);
  const invalidatedRef = useRef(false);

  const isProcessing = !error && (!data || data.status === "PROCESSING");
  const hasFailures = !!data && data.failedCount > 0;
  const isSettled = !!error || (!!data && data.status !== "PROCESSING");
  const percent =
    data && data.totalRequested > 0
      ? Math.min(100, Math.round((data.processedCount / data.totalRequested) * 100))
      : 0;

  useEffect(() => {
    if (!isSettled || invalidatedRef.current) return;
    invalidatedRef.current = true;
    for (const queryKey of SETTLED_INVALIDATION_KEYS) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [isSettled, queryClient]);

  function closeReport() {
    setReportOpen(false);
    onDismiss();
  }

  const tone = error
    ? "error"
    : isProcessing
      ? "processing"
      : data?.status === "FAILED"
        ? "error"
        : hasFailures
          ? "warning"
          : "success";

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "fixed right-6 bottom-6 z-50 w-[min(22rem,calc(100vw-3rem))] rounded-2xl border shadow-lg backdrop-blur-md",
          tone === "processing" && "border-slate-200/80 bg-white/95",
          tone === "success" && "border-emerald-200 bg-emerald-50/95",
          tone === "warning" && "border-amber-200 bg-amber-50/95",
          tone === "error" && "border-destructive/30 bg-destructive-soft/95"
        )}
      >
        <div className="flex items-start gap-3 px-4 py-3.5">
          {tone === "processing" ? (
            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-slate-400" aria-hidden />
          ) : tone === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
          ) : tone === "warning" ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          ) : (
            <XCircle className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
          )}

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-xs font-semibold",
                tone === "success" && "text-emerald-900",
                tone === "warning" && "text-amber-900",
                tone === "error" && "text-destructive",
                tone === "processing" && "text-slate-900"
              )}
            >
              {error
                ? "Batch status unavailable"
                : isProcessing
                  ? "Issuing contracts…"
                  : data?.status === "FAILED"
                    ? "Bulk issuance stopped"
                    : hasFailures
                      ? "Completed with failures"
                      : "All contracts issued"}
            </p>

            {error ? (
              <p className="text-destructive/90 mt-1 text-[11px] leading-relaxed">
                {describeError(error, "Could not read the bulk issuance job status")}
              </p>
            ) : (
              <p
                className={cn(
                  "tabular mt-1 text-[11px]",
                  tone === "success" && "text-emerald-800",
                  tone === "warning" && "text-amber-800",
                  tone === "error" && "text-destructive/90",
                  tone === "processing" && "text-slate-500"
                )}
              >
                {isProcessing
                  ? `${(data?.processedCount ?? 0).toLocaleString()} / ${(
                      data?.totalRequested ?? 0
                    ).toLocaleString()}`
                  : `${(data?.successCount ?? 0).toLocaleString()} issued · ${(
                      data?.failedCount ?? 0
                    ).toLocaleString()} failed`}
              </p>
            )}

            {isProcessing && (
              <div
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Bulk issuance progress"
                className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className="h-full rounded-full bg-slate-900 transition-[width] duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}

            {isSettled && !error && data && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3 w-full bg-white"
                onClick={() => setReportOpen(true)}
              >
                View Report
              </Button>
            )}
          </div>

          {isSettled && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss batch notification"
              className="-mt-1 -mr-1.5 shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      <BulkJobSummaryModal job={data ?? null} open={reportOpen} onClose={closeReport} />
    </>
  );
}
