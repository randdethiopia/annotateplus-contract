import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types/backend";

interface CampaignStatusStyle {
  label: string;
  surfaceClassName: string;
  textClassName: string;
  dotClassName: string;
  glowClassName: string;
  pulse?: boolean;
}

export const CAMPAIGN_STATUS_STYLE: Record<CampaignStatus, CampaignStatusStyle> = {
  DRAFT: {
    label: "Draft",
    surfaceClassName: "bg-slate-100",
    textClassName: "text-slate-700",
    dotClassName: "bg-slate-400",
    glowClassName: "shadow-[0_0_0_3px] shadow-slate-400/20",
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    surfaceClassName: "bg-amber-50",
    textClassName: "text-amber-800",
    dotClassName: "bg-amber-500",
    glowClassName: "shadow-[0_0_0_3px] shadow-amber-500/25",
    pulse: true,
  },
  APPROVED_BY_MANAGER: {
    label: "Approved",
    surfaceClassName: "bg-action-soft",
    textClassName: "text-blue-700",
    dotClassName: "bg-action",
    glowClassName: "shadow-[0_0_0_3px] shadow-action/20",
  },
  DISBURSING: {
    label: "Disbursing",
    surfaceClassName: "bg-violet-50",
    textClassName: "text-violet-700",
    dotClassName: "bg-violet-500",
    glowClassName: "shadow-[0_0_0_3px] shadow-violet-500/25",
    pulse: true,
  },
  DISBURSED: {
    label: "Disbursed",
    surfaceClassName: "bg-emerald-50",
    textClassName: "text-emerald-700",
    dotClassName: "bg-emerald-600",
    glowClassName: "shadow-[0_0_0_3px] shadow-emerald-600/20",
  },
  CANCELLED: {
    label: "Cancelled",
    surfaceClassName: "bg-rose-50",
    textClassName: "text-rose-700",
    dotClassName: "bg-rose-500",
    glowClassName: "shadow-[0_0_0_3px] shadow-rose-500/25",
  },
};

export const CAMPAIGN_STATUS_ORDER: CampaignStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED_BY_MANAGER",
  "DISBURSING",
  "DISBURSED",
  "CANCELLED",
];

export function CampaignStatusBadge({
  status,
  pulse,
  className,
}: {
  status: CampaignStatus;
  /** Overrides the status default, e.g. to mark a row awaiting action. */
  pulse?: boolean;
  className?: string;
}) {
  const meta = CAMPAIGN_STATUS_STYLE[status];
  const isPulsing = pulse ?? meta.pulse ?? false;

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase",
        meta.surfaceClassName,
        meta.textClassName,
        className
      )}
    >
      {isPulsing ? (
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
