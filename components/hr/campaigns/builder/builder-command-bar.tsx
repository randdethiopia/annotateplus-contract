"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CampaignSubmitStage } from "@/lib/hooks/use-campaigns";
import { formatEtb } from "@/lib/money";

function stageLabel(stage: CampaignSubmitStage, done: number, total: number): string {
  switch (stage) {
    case "create":
      return "Creating campaign…";
    case "enroll":
      return "Enrolling annotators…";
    case "compensate":
      return `Applying compensation ${done} of ${total}…`;
    case "approve":
      return "Sending approval request…";
  }
}

export function BuilderCommandBar({
  enrolledCount,
  totalBudget,
  missing,
  isSubmitting,
  stage,
  compensated,
  hasDraft,
  onSubmit,
}: {
  enrolledCount: number;
  totalBudget: number;
  /** Plain-language names of whatever still blocks submission. */
  missing: string[];
  isSubmitting: boolean;
  stage: CampaignSubmitStage | null;
  compensated: { done: number; total: number };
  hasDraft: boolean;
  onSubmit: () => void;
}) {
  const status = isSubmitting && stage
    ? stageLabel(stage, compensated.done, compensated.total)
    : missing.length > 0
      ? `To submit, add: ${missing.join(", ")}.`
      : "Preview total. The final amount is confirmed on approval.";

  return (
    // Fixed rather than sticky, so it spans the viewport while its contents
    // align to the same max-w-7xl column as the page above it.
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/95 shadow-[0_-1px_3px_0_rgb(18_38_63/0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 sm:text-base">
            <span className="tabular">{enrolledCount}</span>{" "}
            {enrolledCount === 1 ? "Worker" : "Workers"} Enrolled
            <span className="mx-2 text-slate-300" aria-hidden>
              ·
            </span>
            Total Budget: <span className="tabular">{formatEtb(totalBudget)}</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500" aria-live="polite">
            {status}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isSubmitting ? (
            <Button type="button" variant="outline" disabled className="flex-1 sm:flex-none">
              Cancel
            </Button>
          ) : (
            <Button asChild variant="outline" className="flex-1 sm:flex-none">
              <Link href="/hr/campaigns">Cancel</Link>
            </Button>
          )}
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || missing.length > 0}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : null}
            {hasDraft && !isSubmitting ? "Retry Submission" : "Submit for Manager Approval"}
            {!isSubmitting && <ArrowRight className="size-4" aria-hidden />}
          </Button>
        </div>
      </div>
    </div>
  );
}
