import { cn } from "@/lib/utils";
import type { ContractStatus } from "@/types/backend";

export const STATUS_STYLE: Record<ContractStatus, { label: string; className: string; dotClassName: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700",
    dotClassName: "bg-slate-400",
  },
  INVITED: {
    label: "Invited",
    className: "bg-blue-100 text-blue-800",
    dotClassName: "bg-blue-500",
  },
  VIEWED: {
    label: "Viewed",
    className: "bg-cyan-100 text-cyan-800",
    dotClassName: "bg-cyan-500",
  },
  PENDING_REVIEW: {
    label: "PENDING REVIEW",
    className: "bg-amber-100 text-amber-900",
    dotClassName: "bg-amber-500",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-teal-100 text-teal-800",
    dotClassName: "bg-teal-500",
  },
  PDF_GENERATION_FAILED: {
    label: "Sealing Failed",
    className: "bg-orange-100 text-orange-800",
    dotClassName: "bg-[#FF4E11]",
  },
  SIGNED: {
    label: "SIGNED",
    className: "bg-emerald-100 text-emerald-800",
    dotClassName: "bg-emerald-500",
  },
  RESUBMISSION_REQUIRED: {
    label: "RESUBMISSION REQUIRED",
    className: "bg-orange-100 text-orange-900",
    dotClassName: "bg-[#FF4E11]",
  },
  REJECTED: {
    label: "REJECTED",
    className: "bg-red-100 text-red-800",
    dotClassName: "bg-red-500",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-gray-100 text-gray-600",
    dotClassName: "bg-gray-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-600",
    dotClassName: "bg-gray-400",
  },
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  const meta = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap",
        meta.className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dotClassName)} aria-hidden />
      {meta.label}
    </span>
  );
}
