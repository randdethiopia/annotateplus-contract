"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { BulkJobDetailDto } from "@/types/backend";

export interface BulkJobSummaryModalProps {
  job: BulkJobDetailDto | null;
  open: boolean;
  onClose: () => void;
}

function CountTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3",
        tone === "success" && "border-emerald-200/80 bg-emerald-50/70",
        tone === "warning" && "border-amber-200/80 bg-amber-50/70",
        tone === "neutral" && "border-slate-200/80 bg-slate-50/70"
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold tracking-wider uppercase",
          tone === "success" && "text-emerald-700",
          tone === "warning" && "text-amber-700",
          tone === "neutral" && "text-slate-500"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "tabular mt-1 text-2xl font-bold",
          tone === "success" && "text-emerald-900",
          tone === "warning" && "text-amber-900",
          tone === "neutral" && "text-slate-900"
        )}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  iconClassName,
}: {
  icon: typeof CheckCircle2;
  title: string;
  iconClassName: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("size-4 shrink-0", iconClassName)} aria-hidden />
      <h3 className="text-xs font-semibold text-slate-900">{title}</h3>
    </div>
  );
}

export function BulkJobSummaryModal({ job, open, onClose }: BulkJobSummaryModalProps) {
  const hasFailures = !!job && job.failedCount > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            {job?.status === "FAILED" ? (
              <>
                <XCircle className="text-destructive size-4 shrink-0" aria-hidden />
                Batch Report &mdash; Stopped
              </>
            ) : hasFailures ? (
              <>
                <AlertTriangle className="size-4 shrink-0 text-amber-600" aria-hidden />
                Batch Report &mdash; Completed with Failures
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
                Batch Report &mdash; Completed
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-0.5 text-xs">
            A full audit of this batch. Failed candidates keep their original status and can be
            re-issued once the reason below is resolved.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {!job ? (
            <p className="text-sm text-slate-500">This batch is no longer available.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                <CountTile label="Requested" value={job.totalRequested} tone="neutral" />
                <CountTile label="Issued" value={job.successCount} tone="success" />
                <CountTile
                  label="Failed"
                  value={job.failedCount}
                  tone={hasFailures ? "warning" : "neutral"}
                />
              </div>

              {job.status === "FAILED" && job.error && (
                <div className="bg-destructive-soft text-destructive rounded-xl px-3.5 py-3 text-sm">
                  {job.error}
                </div>
              )}

              {job.failed.length > 0 && (
                <section className="space-y-2.5">
                  <SectionHeading
                    icon={AlertTriangle}
                    title={`Failed (${job.failed.length})`}
                    iconClassName="text-amber-600"
                  />
                  <ul className="divide-y divide-amber-200/70 rounded-xl border border-amber-200/80 bg-amber-50/50 px-3.5">
                    {job.failed.map((item) => (
                      <li key={item.candidateId} className="py-2.5">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="truncate text-xs font-semibold text-slate-900">
                            {item.candidateName}
                          </span>
                          <span className="tabular font-mono text-[11px] text-slate-500">
                            {item.phone}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed break-words text-amber-900">
                          {item.error}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {job.succeeded.length > 0 && (
                <section className="space-y-2.5">
                  <SectionHeading
                    icon={CheckCircle2}
                    title={`Issued (${job.succeeded.length})`}
                    iconClassName="text-emerald-600"
                  />
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 px-3.5">
                    {job.succeeded.map((item) => (
                      <li
                        key={item.candidateId}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2.5"
                      >
                        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="truncate text-xs font-medium text-slate-900">
                            {item.candidateName}
                          </span>
                          <span className="tabular font-mono text-[11px] text-slate-500">
                            {item.phone}
                          </span>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-700">
                          {item.contractNumber}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {job.succeeded.length === 0 && job.failed.length === 0 && (
                <p className="text-sm text-slate-500">
                  This batch reported no per-candidate results.
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter className="bg-muted/40 shrink-0 border-t px-6 py-4 sm:justify-between">
          <p className="min-w-0 truncate text-[11px] text-slate-500">
            Issued contracts are now in the finance pipeline.
          </p>
          <Button type="button" className="h-11 shrink-0" onClick={onClose}>
            Close Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
