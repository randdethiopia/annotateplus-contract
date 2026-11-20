import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContractStatus } from "@/types/backend";
import { SIGN_ROADMAP_COPY } from "./copy";

type RoadmapStep = 1 | 2 | 3 | 4 | 5;
type StepState = "done" | "current" | "upcoming";

const ACTIVE_STEP: Partial<Record<ContractStatus, RoadmapStep>> = {
  VIEWED: 1,
  RESUBMISSION_REQUIRED: 2,
  PENDING_REVIEW: 3,
  APPROVED: 4,
  PDF_GENERATION_FAILED: 4,
  SIGNED: 5,
};

const MARKER: Record<StepState, string> = {
  done: "bg-emerald-600 text-white",
  current: "bg-action text-action-foreground ring-action/15 ring-4",
  upcoming: "border border-slate-300 text-slate-500",
};

function stepState(step: number, activeStep: RoadmapStep): StepState {
  if (step < activeStep) return "done";
  if (step === activeStep) return "current";
  return "upcoming";
}

function StepMarker({ step, state }: { step: number; state: StepState }) {
  return (
    <span
      className={cn(
        "tabular flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        MARKER[state]
      )}
    >
      {state === "done" ? (
        <>
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
          <span className="sr-only">Completed:</span>
        </>
      ) : (
        <>
          {state === "current" && <span className="sr-only">Current step:</span>}
          {step}
        </>
      )}
    </span>
  );
}

export function SigningRoadmap({
  status,
  className,
}: {
  status: ContractStatus;
  className?: string;
}) {
  const activeStep = ACTIVE_STEP[status];
  if (!activeStep) return null;

  const copy = SIGN_ROADMAP_COPY;
  const lastIndex = copy.steps.length - 1;

  return (
    <section aria-labelledby="signing-roadmap-heading" className={className}>
      {activeStep <= 2 && <p className="mb-6 text-sm text-slate-600">{copy.welcome}</p>}

      <h2
        id="signing-roadmap-heading"
        className="mb-4 text-base font-semibold tracking-tight text-slate-900"
      >
        {copy.heading}
      </h2>

      <ol>
        {copy.steps.map((step, index) => {
          const number = index + 1;
          const state = stepState(number, activeStep);
          const isLast = index === lastIndex;

          return (
            <li
              key={step.title}
              aria-current={state === "current" ? "step" : undefined}
              className={cn("relative flex gap-4", !isLast && "pb-6")}
            >
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-8 bottom-1 left-3.5 w-px -translate-x-1/2",
                    state === "done" ? "bg-emerald-600/40" : "bg-slate-200"
                  )}
                />
              )}
              <StepMarker step={number} state={state} />
              <div className="min-w-0 pt-1">
                <p className="text-sm font-medium text-slate-900">{step.title}</p>
                <p className="mt-1 text-xs text-pretty text-slate-600">{step.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 border-l-2 border-slate-900 py-1 pl-4 text-xs text-slate-600">
        {copy.reassurance}
      </p>
    </section>
  );
}
