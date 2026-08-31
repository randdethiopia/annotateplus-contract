import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TINT_STYLES = {
  amber: {
    card: "bg-amber-50",
    dot: "bg-amber-500",
    label: "text-amber-800",
    value: "text-amber-950",
    hint: "text-amber-700/80",
  },
  orange: {
    card: "bg-orange-50",
    dot: "bg-orange-500",
    label: "text-orange-800",
    value: "text-orange-950",
    hint: "text-orange-700/80",
  },
  emerald: {
    card: "bg-emerald-50",
    dot: "bg-emerald-600",
    label: "text-emerald-800",
    value: "text-emerald-950",
    hint: "text-emerald-700/80",
  },
  red: {
    card: "bg-red-50",
    dot: "bg-destructive",
    label: "text-red-700",
    value: "text-red-950",
    hint: "text-red-700/80",
  },
  action: {
    card: "bg-action-soft",
    dot: "bg-action",
    label: "text-blue-800",
    value: "text-blue-950",
    hint: "text-blue-700/80",
  },
} as const;

export type StatCardTint = keyof typeof TINT_STYLES;

export function StatCard({
  label,
  value,
  hint,
  tint,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tint?: StatCardTint;
  icon?: ReactNode;
  className?: string;
}) {
  const t = tint ? TINT_STYLES[tint] : null;

  return (
    <div
      className={cn(
        "rounded-2xl border-0 p-5 shadow-xs",
        t ? t.card : "bg-card",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {t ? (
          <span className={cn("size-2 shrink-0 rounded-full", t.dot)} aria-hidden />
        ) : (
          icon && <span className="text-muted-foreground shrink-0">{icon}</span>
        )}
        <p
          className={cn(
            "text-[11px] font-semibold tracking-[0.1em] uppercase",
            t ? t.label : "text-muted-foreground"
          )}
        >
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tracking-tight tabular",
          t ? t.value : "text-foreground"
        )}
      >
        {value}
      </p>
      {hint && (
        <p className={cn("mt-1 text-xs", t ? t.hint : "text-muted-foreground")}>{hint}</p>
      )}
    </div>
  );
}
