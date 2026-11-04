import { cn } from "@/lib/utils";
import type { PayoutItemStatus, PayoutStatus } from "@/types/backend";

interface PayoutStatusStyle {
  label: string;
  surfaceClassName: string;
  textClassName: string;
  dotClassName: string;
  glowClassName: string;
  pulse?: boolean;
}

export const PAYOUT_BATCH_STATUS_STYLE: Record<PayoutStatus, PayoutStatusStyle> = {
  DRAFT: {
    label: "Staged",
    surfaceClassName: "bg-slate-100",
    textClassName: "text-slate-700",
    dotClassName: "bg-slate-400",
    glowClassName: "shadow-[0_0_0_3px] shadow-slate-400/20",
  },
  PROCESSING: {
    label: "Processing",
    surfaceClassName: "bg-action-soft",
    textClassName: "text-blue-700",
    dotClassName: "bg-action",
    glowClassName: "shadow-[0_0_0_3px] shadow-action/20",
    pulse: true,
  },
  COMPLETED: {
    label: "Completed",
    surfaceClassName: "bg-emerald-50",
    textClassName: "text-emerald-700",
    dotClassName: "bg-emerald-600",
    glowClassName: "shadow-[0_0_0_3px] shadow-emerald-600/20",
  },
  PARTIALLY_COMPLETED: {
    label: "Partially Completed",
    surfaceClassName: "bg-amber-50",
    textClassName: "text-amber-800",
    dotClassName: "bg-amber-500",
    glowClassName: "shadow-[0_0_0_3px] shadow-amber-500/25",
  },
  FAILED: {
    label: "Failed",
    surfaceClassName: "bg-rose-50",
    textClassName: "text-rose-700",
    dotClassName: "bg-rose-500",
    glowClassName: "shadow-[0_0_0_3px] shadow-rose-500/25",
  },
};

export const PAYOUT_ITEM_STATUS_STYLE: Record<PayoutItemStatus, PayoutStatusStyle> = {
  STAGED: {
    label: "Staged",
    surfaceClassName: "bg-slate-100",
    textClassName: "text-slate-700",
    dotClassName: "bg-slate-400",
    glowClassName: "shadow-[0_0_0_3px] shadow-slate-400/20",
  },
  QUEUED: {
    label: "Queued",
    surfaceClassName: "bg-action-soft",
    textClassName: "text-blue-700",
    dotClassName: "bg-action",
    glowClassName: "shadow-[0_0_0_3px] shadow-action/20",
    pulse: true,
  },
  SUCCESS: {
    label: "Paid",
    surfaceClassName: "bg-emerald-50",
    textClassName: "text-emerald-700",
    dotClassName: "bg-emerald-600",
    glowClassName: "shadow-[0_0_0_3px] shadow-emerald-600/20",
  },
  FAILED: {
    label: "Failed",
    surfaceClassName: "bg-rose-50",
    textClassName: "text-rose-700",
    dotClassName: "bg-rose-500",
    glowClassName: "shadow-[0_0_0_3px] shadow-rose-500/25",
  },
};

function StatusPill({ meta, className }: { meta: PayoutStatusStyle; className?: string }) {
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

export function PayoutStatusBadge({
  status,
  className,
}: {
  status: PayoutStatus;
  className?: string;
}) {
  return <StatusPill meta={PAYOUT_BATCH_STATUS_STYLE[status]} className={className} />;
}

export function PayoutItemBadge({
  status,
  className,
}: {
  status: PayoutItemStatus;
  className?: string;
}) {
  return <StatusPill meta={PAYOUT_ITEM_STATUS_STYLE[status]} className={className} />;
}

export function PayoutItemDotLabel({
  status,
  className,
}: {
  status: PayoutItemStatus;
  className?: string;
}) {
  const meta = PAYOUT_ITEM_STATUS_STYLE[status];
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
