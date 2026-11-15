"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

export interface ChoiceOption {
  readonly value: string;
  readonly label: string;
}

export interface ChoiceFieldProps {
  label: string;
  options: readonly ChoiceOption[];
  registration: UseFormRegisterReturn;
  layout?: "segmented" | "cards";
  invalid?: boolean;
}

export function ChoiceField({
  label,
  options,
  registration,
  layout = "segmented",
  invalid,
}: ChoiceFieldProps) {
  const isSegmented = layout === "segmented";

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      className={cn(isSegmented ? "flex gap-3" : "space-y-2.5")}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "group cursor-pointer transition-all duration-100 active:scale-[0.99]",
            "has-focus-visible:ring-2 has-focus-visible:ring-slate-900/10",
            isSegmented
              ? [
                  "flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-medium text-slate-600 shadow-xs",
                  "hover:border-slate-300",
                  "has-checked:border-slate-900 has-checked:bg-slate-900 has-checked:font-semibold has-checked:text-white",
                ]
              : [
                  "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-700",
                  "hover:border-slate-300",
                  "has-checked:border-slate-900 has-checked:bg-slate-50/50 has-checked:font-medium has-checked:text-slate-900 has-checked:ring-1 has-checked:ring-slate-900/10",
                ]
          )}
        >
          <input type="radio" value={option.value} className="sr-only" {...registration} />
          <span className={cn(isSegmented && "truncate")}>{option.label}</span>
          {!isSegmented && (
            <span
              aria-hidden
              className="flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-300 transition-colors group-has-checked:border-slate-900 group-has-checked:bg-slate-900"
            >
              <span className="size-1.5 rounded-full bg-white opacity-0 transition-opacity group-has-checked:opacity-100" />
            </span>
          )}
        </label>
      ))}
    </div>
  );
}
