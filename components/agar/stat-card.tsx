import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TINT_STYLES = {
  amber: {
    card: "bg-amber-50",
    dot: "bg-amber-500",
    label: "text-amber-900",
    value: "text-amber-950",
    hint: "text-amber-700/80",
  },
  orange: {
    card: "bg-orange-50",
    dot: "bg-[#FF4E11]",
    label: "text-orange-900",
    value: "text-orange-950",
    hint: "text-orange-700/80",
  },
  emerald: {
    card: "bg-emerald-50",
    dot: "bg-emerald-500",
    label: "text-emerald-900",
    value: "text-emerald-950",
    hint: "text-emerald-700/80",
  },
  red: {
    card: "bg-red-50",
    dot: "bg-red-500",
    label: "text-red-900",
    value: "text-red-950",
    hint: "text-red-700/80",
  },
} as const;

export function StatCard({
  label,
  value,
  hint,
  tint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tint?: keyof typeof TINT_STYLES;
  className?: string;
}) {
  const tintStyles = tint ? TINT_STYLES[tint] : null;

  return (
    <div
      className={cn(
        "rounded-xl border-0 p-5 shadow-xs",
        tintStyles ? tintStyles.card : "bg-white",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {tintStyles && (
          <span className={cn("size-2 shrink-0 rounded-full", tintStyles.dot)} aria-hidden />
        )}
        <p
          className={cn(
            "text-sm font-semibold uppercase tracking-wide",
            tintStyles ? tintStyles.label : "text-muted-foreground"
          )}
        >
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-bold",
          tintStyles ? tintStyles.value : "text-[#1A4428]"
        )}
      >
        {value}
      </p>
      {hint && (
        <p className={cn("mt-1 text-xs", tintStyles ? tintStyles.hint : "text-muted-foreground")}>
          {hint}
        </p>
      )}
    </div>
  );
}
