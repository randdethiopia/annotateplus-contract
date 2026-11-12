"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CampaignSubmitStage } from "@/lib/hooks/use-campaigns";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { WizardStep } from "./wizard-steps";

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

export function WizardFooter({
  step,
  enrolledCount,
  totalBudget,
  canAdvance,
  blockedReason,
  isSubmitting,
  stage,
  compensated,
  hasDraft,
  onBack,
  onNext,
  onSubmit,
  className,
}: {
  step: WizardStep;
  enrolledCount: number;
  totalBudget: number;
  canAdvance: boolean;
  blockedReason?: string;
  isSubmitting: boolean;
  stage: CampaignSubmitStage | null;
  compensated: { done: number; total: number };
  hasDraft: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  className?: string;
}) {
  const isReview = step === 3;

  const headline =
    step === 1
      ? "Set the project rules and pick the executive who will authorize this run."
      : `${enrolledCount.toLocaleString()} ${enrolledCount === 1 ? "Worker" : "Workers"} Enrolled · Total Budget: ${formatEtb(totalBudget)}`;

  const status = isSubmitting && stage
    ? stageLabel(stage, compensated.done, compensated.total)
    : !canAdvance && blockedReason
      ? blockedReason
      : isReview
        ? "Preview total. The final amount is confirmed on approval."
        : "";

  const nextLabel =
    step === 1
      ? "Continue to Worker Enrollment"
      : `Continue to Review (${enrolledCount.toLocaleString()} ${enrolledCount === 1 ? "Worker" : "Workers"})`;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-slate-900">{headline}</p>
          {status && (
            <p className="mt-0.5 truncate text-xs text-slate-500" aria-live="polite">
              {status}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {step === 1 ? (
            <Button asChild variant="outline" className="flex-1 sm:flex-none">
              <Link href="/hr/campaigns">Cancel</Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {step === 2 ? "Back to Details" : "Back to Workers"}
            </Button>
          )}

          <Button
            type="button"
            onClick={isReview ? onSubmit : onNext}
            disabled={isSubmitting || !canAdvance}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting && (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            )}
            {isReview
              ? hasDraft && !isSubmitting
                ? "Retry Submission"
                : "Lock Campaign & Dispatch Manager SMS"
              : nextLabel}
            {!isSubmitting && <ArrowRight className="size-4" aria-hidden />}
          </Button>
        </div>
      </div>
    </div>
  );
}
