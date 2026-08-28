import { AlertTriangle } from "lucide-react";
import type { WorkerRejectionFeedback } from "@/types/backend";
import { REJECTION_CATEGORY_SHORT_LABELS } from "@/lib/rejection-categories";

export function RejectionFeedbackCard({
  feedback,
  currentAttemptNumber,
  maxAttempts,
}: {
  feedback: WorkerRejectionFeedback;
  currentAttemptNumber: number;
  maxAttempts?: number;
}) {
  const effectiveMaxAttempts = maxAttempts || 3;
  const attemptsRemaining = Math.max(0, 3 - currentAttemptNumber);
  const categoryLabel = REJECTION_CATEGORY_SHORT_LABELS[feedback.category];

  return (
    <div className="mb-6 space-y-4 rounded-2xl border border-red-200/80 border-l-4 border-l-red-500 bg-red-50/90 p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 shrink-0 text-red-600" aria-hidden />
          <h2 className="text-lg font-bold text-red-900">Action Required: Submission Rejected</h2>
        </div>
        <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
          Attempt {currentAttemptNumber} of {effectiveMaxAttempts} ({attemptsRemaining} attempts
          remaining)
        </span>
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-800">
        ● {categoryLabel}
      </span>

      <div>
        <p className="rounded-xl border border-red-100 bg-white/80 p-3.5 text-sm font-medium text-red-900">
          {feedback.reasonEnglish}
        </p>
        {feedback.reasonAmharic && (
          <p className="font-ethiopic mt-2 rounded-xl border border-red-100 bg-white/80 p-3.5 text-sm font-medium text-red-900">
            {feedback.reasonAmharic}
          </p>
        )}
      </div>

      <p className="text-xs font-semibold text-red-700">
        <em>
          Please review the feedback above, attach clear replacement photos below, and re-submit
          your agreement.
        </em>
      </p>
    </div>
  );
}
