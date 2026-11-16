"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkJobSummaryModal } from "@/components/finance/bulk-job-summary-modal";
import { describeError } from "@/lib/describe-error";
import { cn } from "@/lib/utils";
import type { BulkJobDetailDto, BulkReminderJobStatusDto } from "@/types/backend";

type Tone = "processing" | "success" | "warning" | "error";

interface TrackedJobView<T> {
  job: T | undefined;
  error: Error | null;
  onDismiss: () => void;
}

export interface BulkJobPillProps {
  issue: TrackedJobView<BulkJobDetailDto> | null;
  remind: TrackedJobView<BulkReminderJobStatusDto> | null;
}

function toPercent(done: number, total: number): number {
  return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
}

function JobStatusRow({
  tone,
  title,
  detail,
  note,
  percent,
  progressLabel,
  action,
  dismissLabel,
  onDismiss,
}: {
  tone: Tone;
  title: string;
  detail: string;
  note?: string;
  percent: number;
  progressLabel: string;
  action?: ReactNode;
  dismissLabel: string;
  onDismiss: () => void;
}) {
  const isProcessing = tone === "processing";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto rounded-2xl border shadow-lg backdrop-blur-md",
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
            {title}
          </p>
          <p
            className={cn(
              "tabular mt-1 text-[11px]",
              tone === "success" && "text-emerald-800",
              tone === "warning" && "text-amber-800",
              tone === "error" && "text-destructive/90",
              tone === "processing" && "text-slate-500"
            )}
          >
            {detail}
          </p>
          {note && (
            <p className="text-destructive/90 mt-1 text-[11px] leading-relaxed break-words">
              {note}
            </p>
          )}

          {isProcessing && (
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={progressLabel}
              className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className="h-full rounded-full bg-slate-900 transition-[width] duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}

          {action}
        </div>

        {!isProcessing && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="-mt-1 -mr-1.5 shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

function IssueJobRow({ job, error, onDismiss }: TrackedJobView<BulkJobDetailDto>) {
  const [reportOpen, setReportOpen] = useState(false);
  // An error only takes over the row before the first snapshot; after that the
  // poll keeps retrying on the last known state.
  const showError = !!error && !job;
  const isProcessing = !showError && (!job || job.status === "PROCESSING");

  const tone: Tone = showError
    ? "error"
    : isProcessing
      ? "processing"
      : job?.status === "FAILED"
        ? "error"
        : job && job.failedCount > 0
          ? "warning"
          : "success";

  const title = showError
    ? "Batch status unavailable"
    : isProcessing
      ? "Issuing contracts…"
      : job?.status === "FAILED"
        ? "Bulk issuance stopped"
        : tone === "warning"
          ? "Completed with failures"
          : "All contracts issued";

  const detail = showError
    ? describeError(error, "Could not read the bulk issuance job status")
    : isProcessing
      ? `${(job?.processedCount ?? 0).toLocaleString()} / ${(job?.totalRequested ?? 0).toLocaleString()}`
      : `${(job?.successCount ?? 0).toLocaleString()} issued · ${(job?.failedCount ?? 0).toLocaleString()} failed`;

  function closeReport() {
    setReportOpen(false);
    onDismiss();
  }

  return (
    <>
      <JobStatusRow
        tone={tone}
        title={title}
        detail={detail}
        percent={toPercent(job?.processedCount ?? 0, job?.totalRequested ?? 0)}
        progressLabel="Bulk issuance progress"
        dismissLabel="Dismiss bulk issuance notification"
        onDismiss={onDismiss}
        action={
          !isProcessing && job ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 w-full bg-white"
              onClick={() => setReportOpen(true)}
            >
              View Report
            </Button>
          ) : undefined
        }
      />
      <BulkJobSummaryModal job={job ?? null} open={reportOpen} onClose={closeReport} />
    </>
  );
}

function ReminderJobRow({ job, error, onDismiss }: TrackedJobView<BulkReminderJobStatusDto>) {
  const showError = !!error && !job;
  const isProcessing = !showError && (!job || job.status === "PROCESSING");

  const tone: Tone = showError
    ? "error"
    : isProcessing
      ? "processing"
      : job?.status === "FAILED"
        ? "error"
        : job && job.failedCount > 0
          ? "warning"
          : "success";

  const title = showError
    ? "Reminder status unavailable"
    : isProcessing
      ? "Sending SMS reminders…"
      : job?.status === "FAILED"
        ? "Reminder dispatch stopped"
        : tone === "warning"
          ? "Reminders finished with failures"
          : "Reminders sent";

  const counts = job
    ? [
        `${job.sentCount.toLocaleString()} sent`,
        `${job.skippedCount.toLocaleString()} skipped`,
        ...(job.failedCount > 0 ? [`${job.failedCount.toLocaleString()} failed`] : []),
      ].join(" · ")
    : "";

  const detail = showError
    ? describeError(error, "Could not read the reminder job status")
    : isProcessing
      ? `${(job?.processedCount ?? 0).toLocaleString()} / ${(job?.totalTargeted ?? 0).toLocaleString()}`
      : counts;

  return (
    <JobStatusRow
      tone={tone}
      title={title}
      detail={detail}
      note={job?.status === "FAILED" ? job.error : undefined}
      percent={toPercent(job?.processedCount ?? 0, job?.totalTargeted ?? 0)}
      progressLabel="Bulk reminder progress"
      dismissLabel="Dismiss bulk reminder notification"
      onDismiss={onDismiss}
    />
  );
}

/**
 * App-wide dock for background bulk jobs. It lifts clear of any full-bleed
 * bar that opts in with `data-fixed-bottom-bar`, so it never covers a page's
 * primary actions on a phone.
 */
export function BulkJobPill({ issue, remind }: BulkJobPillProps) {
  return (
    <div className="pointer-events-none fixed right-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 flex w-[min(22rem,calc(100vw-3rem))] flex-col gap-2 [body:has([data-fixed-bottom-bar])_&]:bottom-[calc(max(1rem,env(safe-area-inset-bottom))_+_5.5rem)]">
      {remind && <ReminderJobRow {...remind} />}
      {issue && <IssueJobRow {...issue} />}
    </div>
  );
}
