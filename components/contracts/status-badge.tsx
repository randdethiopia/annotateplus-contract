import { cn } from "@/lib/utils";
import type { ContractStatus } from "@/types/backend";

export const STATUS_STYLE: Record<ContractStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  INVITED: { label: "Invited", className: "bg-blue-100 text-blue-800" },
  VIEWED: { label: "Viewed", className: "bg-indigo-100 text-indigo-800" },
  PENDING_REVIEW: { label: "Pending Review", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Approved", className: "bg-teal-100 text-teal-800" },
  PDF_GENERATION_FAILED: { label: "Sealing Failed", className: "bg-orange-100 text-orange-800" },
  SIGNED: { label: "Signed", className: "bg-green-100 text-green-800" },
  RESUBMISSION_REQUIRED: { label: "Action Required", className: "bg-yellow-100 text-yellow-900" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
  EXPIRED: { label: "Expired", className: "bg-slate-200 text-slate-700" },
  CANCELLED: { label: "Cancelled", className: "bg-zinc-200 text-zinc-700" },
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  const meta = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}
