import { VULNERABILITY_OPTIONS } from "@/lib/ethiopia";
import { cn } from "@/lib/utils";
import type { CandidateStatus, VulnerabilityStatus } from "@/types/backend";

interface CandidateStatusStyle {
  label: string;
  className: string;
  dotClassName: string;
  pulse?: boolean;
}

export const CANDIDATE_STATUS_STYLE: Record<CandidateStatus, CandidateStatusStyle> = {
  NEW: {
    label: "New",
    className: "bg-amber-50 text-amber-800 border-amber-200/60",
    dotClassName: "bg-amber-500",
    pulse: true,
  },
  SHORTLISTED: {
    label: "Shortlisted",
    className: "bg-blue-50 text-blue-700 border-blue-200/60",
    dotClassName: "bg-blue-500",
    pulse: true,
  },
  CONTRACT_ISSUED: {
    label: "Contract Issued",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    dotClassName: "bg-emerald-600",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200/60",
    dotClassName: "bg-rose-500",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-slate-100 text-slate-600 border-slate-200/60",
    dotClassName: "bg-slate-400",
  },
};

export const CANDIDATE_STATUS_VALUES = Object.keys(
  CANDIDATE_STATUS_STYLE
) as CandidateStatus[];

export function candidateStatusLabel(status: CandidateStatus): string {
  return CANDIDATE_STATUS_STYLE[status]?.label ?? status;
}

export function CandidateStatusBadge({ status }: { status: CandidateStatus }) {
  const style = CANDIDATE_STATUS_STYLE[status];

  if (!style) {
    return (
      <span className="inline-flex w-fit items-center rounded-full border border-slate-200/60 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
        {status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase",
        style.className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          style.dotClassName,
          style.pulse && "animate-pulse motion-reduce:animate-none"
        )}
      />
      {style.label}
    </span>
  );
}

export function CandidateStatusTag({ status }: { status: CandidateStatus }) {
  const style = CANDIDATE_STATUS_STYLE[status];
  if (!style) return null;

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        style.className
      )}
    >
      {style.label}
    </span>
  );
}

export function vulnerabilityLabel(value: VulnerabilityStatus): string {
  return VULNERABILITY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function VulnerabilityPill({ value }: { value: VulnerabilityStatus }) {
  if (value === "NONE") {
    return <span className="text-xs text-slate-400">&mdash;</span>;
  }

  return (
    <span className="inline-flex w-fit items-center rounded-md bg-cyan-50 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-cyan-700">
      {vulnerabilityLabel(value)}
    </span>
  );
}
