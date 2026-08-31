import { AlertTriangle, Camera } from "lucide-react";
import type { WorkerRejectionFeedback } from "@/types/backend";
import { REJECTION_CATEGORY_SHORT_LABELS } from "@/lib/rejection-categories";
import { DEFAULT_MAX_ATTEMPTS } from "@/lib/status-actions";

export function RejectionFeedbackCard({
  feedback,
  currentAttemptNumber,
  maxAttempts,
}: {
  feedback: WorkerRejectionFeedback;
  currentAttemptNumber: number;
  maxAttempts?: number;
}) {
  const effectiveMaxAttempts = maxAttempts || DEFAULT_MAX_ATTEMPTS;
  const attemptsRemaining = Math.max(0, effectiveMaxAttempts - currentAttemptNumber);
  const categoryLabel = REJECTION_CATEGORY_SHORT_LABELS[feedback.category];
  const isLastChance = attemptsRemaining <= 1;

  return (
    <div className="border-destructive bg-card overflow-hidden rounded-2xl border-l-4 shadow-xs">
      <div className="bg-destructive-soft flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="text-destructive mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <h2 className="text-base font-bold text-red-900">
              Action required — we need a new submission
            </h2>
            <p className="font-ethiopic mt-0.5 text-sm text-red-800/80">
              እርምጃ ያስፈልጋል — እንደገና ማስገባት ይኖርብዎታል
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            isLastChance ? "bg-destructive text-white" : "bg-red-100 text-red-800"
          }`}
        >
          {attemptsRemaining === 0
            ? "No attempts left"
            : `${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} left`}
        </span>
      </div>

      <div className="space-y-3 px-5 py-4">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-red-800 uppercase">
          <span className="bg-destructive size-1.5 rounded-full" aria-hidden />
          {categoryLabel}
        </span>

        <div className="space-y-2">
          <p className="bg-surface-subtle text-foreground rounded-xl p-3.5 text-sm font-medium">
            {feedback.reasonEnglish}
          </p>
          {feedback.reasonAmharic && (
            <p className="font-ethiopic bg-surface-subtle text-foreground rounded-xl p-3.5 text-sm font-medium">
              {feedback.reasonAmharic}
            </p>
          )}
        </div>

        <p className="text-muted-foreground flex items-start gap-2 text-xs">
          <Camera className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            Your details below are already filled in from last time — you only need to replace
            the photos and submit again.
          </span>
        </p>
      </div>
    </div>
  );
}
