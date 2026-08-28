import {
  REJECTION_CATEGORY_SHORT_LABELS,
} from "@/lib/rejection-categories";
import type { AttemptSummaryDto } from "@/types/backend";

export function AttemptHistory({ attempts }: { attempts: AttemptSummaryDto[] }) {
  if (attempts.length === 0) return null;

  const priorAttempts = attempts.slice(0, -1);
  const rejectedPrior = priorAttempts.filter((a) => a.status === "REJECTED");

  if (rejectedPrior.length === 0 && priorAttempts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Attempt history</h2>
      <div className="space-y-3">
        {priorAttempts.map((attempt) => (
          <div
            key={attempt.attemptId}
            className="rounded-lg border border-gray-200 bg-white p-4 text-sm"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-slate-900">
                Attempt {attempt.attemptNumber}
              </span>
              <span className="text-slate-500 capitalize">
                {attempt.status.replace(/_/g, " ").toLowerCase()}
              </span>
            </div>

            {attempt.status === "REJECTED" && attempt.rejectionCategory && (
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  <span className="size-1.5 rounded-full bg-red-600" aria-hidden />
                  {REJECTION_CATEGORY_SHORT_LABELS[attempt.rejectionCategory]}
                </span>
                {attempt.rejectionReasonEnglish && (
                  <p className="text-slate-700">{attempt.rejectionReasonEnglish}</p>
                )}
                {attempt.rejectionReasonAmharic && (
                  <p className="font-ethiopic text-sm text-slate-600">
                    {attempt.rejectionReasonAmharic}
                  </p>
                )}
              </div>
            )}

            {attempt.reviewedAt && (
              <p className="mt-2 text-xs text-slate-400">
                Reviewed {new Date(attempt.reviewedAt).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
