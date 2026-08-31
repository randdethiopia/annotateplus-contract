import { cn } from "@/lib/utils";
import type { ContractStatus } from "@/types/backend";

interface StatusStyle {
  label: string;
  /** Soft-tint pill surface. Always borderless. */
  surfaceClassName: string;
  /** Label colour on its own, so a dot+label row can reuse it without the pill. */
  textClassName: string;
  /** Dot fill only — no shadow, because the ping layer reuses this class. */
  dotClassName: string;
  /** The glow halo, applied to the solid dot only. */
  glowClassName: string;
  /**
   * Animate the dot. Reserved for states the queue is actively waiting on —
   * a permanent pulse on a settled record is just noise down a 20-row table.
   */
  pulse?: boolean;
}

export const STATUS_STYLE: Record<ContractStatus, StatusStyle> = {
  DRAFT: {
    label: "Draft",
    surfaceClassName: "bg-slate-100",
    textClassName: "text-slate-700",
    dotClassName: "bg-slate-400",
    glowClassName: "shadow-[0_0_0_3px] shadow-slate-400/20",
  },
  INVITED: {
    label: "Invited",
    surfaceClassName: "bg-action-soft",
    textClassName: "text-blue-700",
    dotClassName: "bg-action",
    glowClassName: "shadow-[0_0_0_3px] shadow-action/20",
    pulse: true,
  },
  VIEWED: {
    label: "Viewed",
    surfaceClassName: "bg-cyan-50",
    textClassName: "text-cyan-800",
    dotClassName: "bg-cyan-500",
    glowClassName: "shadow-[0_0_0_3px] shadow-cyan-500/20",
    pulse: true,
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    surfaceClassName: "bg-amber-50",
    textClassName: "text-amber-700",
    dotClassName: "bg-amber-500",
    glowClassName: "shadow-[0_0_0_3px] shadow-amber-500/25",
    pulse: true,
  },
  APPROVED: {
    label: "Approved",
    surfaceClassName: "bg-teal-50",
    textClassName: "text-teal-800",
    dotClassName: "bg-teal-500",
    glowClassName: "shadow-[0_0_0_3px] shadow-teal-500/20",
  },
  PDF_GENERATION_FAILED: {
    label: "Sealing Failed",
    surfaceClassName: "bg-orange-100",
    textClassName: "text-orange-900",
    dotClassName: "bg-orange-700",
    glowClassName: "shadow-[0_0_0_3px] shadow-orange-700/20",
    pulse: true,
  },
  SIGNED: {
    label: "Signed",
    surfaceClassName: "bg-emerald-50",
    textClassName: "text-emerald-700",
    dotClassName: "bg-emerald-600",
    glowClassName: "shadow-[0_0_0_3px] shadow-emerald-600/20",
  },
  RESUBMISSION_REQUIRED: {
    label: "Resubmission Required",
    surfaceClassName: "bg-rose-50",
    textClassName: "text-rose-700",
    dotClassName: "bg-rose-500",
    glowClassName: "shadow-[0_0_0_3px] shadow-rose-500/25",
    pulse: true,
  },
  REJECTED: {
    label: "Rejected",
    surfaceClassName: "bg-red-50",
    textClassName: "text-red-700",
    dotClassName: "bg-destructive",
    glowClassName: "shadow-[0_0_0_3px] shadow-destructive/20",
  },
  EXPIRED: {
    label: "Expired",
    surfaceClassName: "bg-slate-100",
    textClassName: "text-slate-600",
    dotClassName: "bg-slate-400",
    glowClassName: "shadow-[0_0_0_3px] shadow-slate-400/20",
  },
  CANCELLED: {
    label: "Cancelled",
    surfaceClassName: "bg-slate-100",
    textClassName: "text-slate-600",
    dotClassName: "bg-slate-300",
    glowClassName: "shadow-[0_0_0_3px] shadow-slate-300/25",
  },
};

/**
 * Compact dot + label, for dense table rows where a full pill would be noise.
 * Shares STATUS_STYLE with StatusBadge so the two can never disagree on what a
 * status is called or coloured.
 */
export function StatusDotLabel({
  status,
  className,
}: {
  status: ContractStatus;
  className?: string;
}) {
  const meta = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap",
        meta.textClassName,
        className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dotClassName)} aria-hidden />
      <span className="text-xs font-medium">{meta.label}</span>
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: ContractStatus;
  className?: string;
}) {
  const meta = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase",
        meta.surfaceClassName,
        meta.textClassName,
        className
      )}
    >
      {meta.pulse ? (
        <span className="relative flex size-1.5 shrink-0" aria-hidden>
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:animate-none",
              meta.dotClassName
            )}
          />
          <span
            className={cn(
              "relative inline-flex size-1.5 rounded-full",
              meta.dotClassName,
              meta.glowClassName
            )}
          />
        </span>
      ) : (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", meta.dotClassName, meta.glowClassName)}
          aria-hidden
        />
      )}
      {meta.label}
    </span>
  );
}
