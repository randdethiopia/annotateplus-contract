import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const STEP_TITLES = ["Personal Info", "Demographics", "Background"] as const;

export function Stepper({ current }: { current: number }) {
  return (
    <div>
      <p className="sr-only" aria-live="polite">
        Step {current + 1} of {STEP_TITLES.length}: {STEP_TITLES[current]}
      </p>
      <ol className="flex items-center" aria-label="Application progress">
        {STEP_TITLES.map((title, index) => {
          const isComplete = index < current;
          const isActive = index === current;
          const isLast = index === STEP_TITLES.length - 1;

          return (
            <li
              key={title}
              aria-current={isActive ? "step" : undefined}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                  isComplete && "bg-emerald-600 text-white",
                  isActive && "bg-slate-900 text-white shadow-xs",
                  !isComplete && !isActive && "border border-slate-200 bg-slate-100 text-slate-400"
                )}
              >
                {isComplete ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "ml-2.5 hidden text-xs font-medium whitespace-nowrap transition-colors duration-300 sm:block",
                  isActive ? "text-slate-900" : "text-slate-400"
                )}
              >
                {title}
              </span>
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-3 h-0.5 flex-1 rounded-full transition-all duration-300",
                    isComplete ? "bg-emerald-600" : "bg-slate-200"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
