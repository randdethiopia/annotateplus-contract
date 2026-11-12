"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = 1 | 2 | 3;

export const WIZARD_STEPS: { value: WizardStep; label: string }[] = [
  { value: 1, label: "Campaign & Approver" },
  { value: 2, label: "Enroll Workers" },
  { value: 3, label: "Review & Submit" },
];

export function WizardSteps({
  current,
  furthest,
  disabled = false,
  onStepChange,
  className,
}: {
  current: WizardStep;
  furthest: WizardStep;
  disabled?: boolean;
  onStepChange: (step: WizardStep) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Campaign builder progress" className={cn("bg-background", className)}>
      <ol className="flex flex-col border-y border-slate-200 sm:h-20 sm:flex-row sm:items-stretch">
        {WIZARD_STEPS.map((step) => {
          const isComplete = step.value < current;
          const isCurrent = step.value === current;
          const isReachable = step.value <= furthest && !disabled && !isCurrent;

          return (
            <li key={step.value} className="flex min-w-0 flex-1 items-stretch">
              <button
                type="button"
                disabled={!isReachable}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onStepChange(step.value)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3 border-l px-5 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none",
                  isCurrent ? "border-l-2 border-slate-900" : "border-slate-200",
                  isReachable && "hover:bg-slate-100/70",
                  !isCurrent && !isReachable && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors",
                    isCurrent
                      ? "bg-slate-900 text-white"
                      : isComplete
                        ? "bg-slate-900/10 text-slate-700"
                        : "text-slate-400"
                  )}
                  aria-hidden
                >
                  {isComplete ? <Check className="size-4" /> : step.value}
                </span>

                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-[15px] font-medium",
                      isCurrent
                        ? "font-semibold text-slate-900"
                        : isComplete
                          ? "text-slate-700"
                          : "text-slate-400"
                    )}
                  >
                    {step.label}
                  </span>
                </span>
              </button>


            </li>
          );
        })}
      </ol>
    </nav>
  );
}
