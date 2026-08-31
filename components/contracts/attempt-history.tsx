import { CheckCircle2, Clock, History, XCircle } from "lucide-react";
import { REJECTION_CATEGORY_SHORT_LABELS } from "@/lib/rejection-categories";
import { cn } from "@/lib/utils";
import type { AttemptSummaryDto } from "@/types/backend";

const OUTCOME = {
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    marker: "bg-emerald-50 text-emerald-700",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    marker: "bg-destructive-soft text-destructive",
  },
  PENDING_REVIEW: {
    label: "Pending review",
    icon: Clock,
    marker: "bg-amber-50 text-amber-700",
  },
} as const;

export function AttemptHistory({ attempts }: { attempts: AttemptSummaryDto[] }) {
  // The last entry is the submission currently on screen — history is what came before.
  const priorAttempts = attempts.slice(0, -1);
  if (priorAttempts.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <h2 className="text-foreground text-base font-semibold tracking-tight">
          Attempt history
        </h2>
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
          {priorAttempts.length}
        </span>
      </div>

      <ol className="relative space-y-4">
        {priorAttempts.map((attempt, index) => {
          const outcome = OUTCOME[attempt.status];
          const Icon = outcome.icon;
          const isLast = index === priorAttempts.length - 1;

          return (
            <li key={attempt.attemptId} className="relative flex gap-3.5">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    outcome.marker
                  )}
                  aria-hidden
                >
                  <Icon className="size-4" />
                </span>
                {!isLast && <span className="bg-border mt-1 w-px flex-1" aria-hidden />}
              </div>

              <div className={cn("min-w-0 flex-1", !isLast && "pb-1")}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="text-foreground text-sm font-semibold">
                    Attempt {attempt.attemptNumber}
                    <span className="text-muted-foreground ml-2 font-normal">
                      {outcome.label}
                    </span>
                  </p>
                  {attempt.reviewedAt && (
                    <time
                      dateTime={attempt.reviewedAt}
                      className="text-muted-foreground text-xs"
                    >
                      {new Date(attempt.reviewedAt).toLocaleString()}
                    </time>
                  )}
                </div>

                {attempt.status === "REJECTED" && attempt.rejectionCategory && (
                  <div className="mt-2 space-y-2">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-red-800 uppercase">
                      <span className="bg-destructive size-1.5 rounded-full" aria-hidden />
                      {REJECTION_CATEGORY_SHORT_LABELS[attempt.rejectionCategory]}
                    </span>
                    {attempt.rejectionReasonEnglish && (
                      <p className="bg-surface-subtle text-foreground rounded-lg px-3 py-2 text-sm">
                        {attempt.rejectionReasonEnglish}
                      </p>
                    )}
                    {attempt.rejectionReasonAmharic && (
                      <p className="font-ethiopic bg-surface-subtle text-foreground rounded-lg px-3 py-2 text-sm">
                        {attempt.rejectionReasonAmharic}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
