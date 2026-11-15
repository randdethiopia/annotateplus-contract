"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { formatAgreementDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { CandidateItemDto, CandidateStatus } from "@/types/backend";
import { CandidateStatusBadge, VulnerabilityPill } from "@/components/candidates/candidate-status";

const HEAD_CELL =
  "h-11 px-4 text-[11px] font-semibold tracking-wider text-slate-400 uppercase whitespace-nowrap";

const COLUMNS = [
  "Candidate",
  "Phone",
  "Age & Gender",
  "Region",
  "Inclusivity",
  "Training",
  "Status",
  "Actions",
];

const ACTION_BUTTON =
  "inline-flex h-7 items-center rounded-lg border px-2.5 text-[11px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none";

export function CandidatesTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
      <table className="w-full border-collapse text-left">
        <thead className="border-b border-slate-200/80 bg-slate-50/70">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className={HEAD_CELL}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, index) => (
            <tr key={index} className="border-b border-slate-100">
              {COLUMNS.map((column) => (
                <td key={column} className="px-4 py-3.5">
                  <span className="block h-4 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CandidatesTable({
  items,
  onUpdateStatus,
  pendingId,
}: {
  items: CandidateItemDto[];
  onUpdateStatus: (id: string, status: CandidateStatus) => void;
  pendingId: string | null;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
      <table className="w-full border-collapse text-left">
        <thead className="border-b border-slate-200/80 bg-slate-50/70">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className={HEAD_CELL}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((candidate) => {
            const isPending = pendingId === candidate._id;

            return (
              <tr
                key={candidate._id}
                className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60"
              >
                <td className="px-4 py-3.5">
                  <span className="block text-sm font-medium text-slate-900">
                    {candidate.fullName}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-500">
                      Applied {formatAgreementDate(candidate.createdAt)}
                    </span>
                    {candidate.source && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 uppercase">
                        {candidate.source}
                      </span>
                    )}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <span className="tabular font-mono text-xs whitespace-nowrap text-slate-600">
                    {candidate.phone}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <span className="text-xs whitespace-nowrap text-slate-600">
                    {candidate.age} yrs &middot;{" "}
                    {candidate.gender === "MALE" ? "Male" : "Female"}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <span className="inline-block rounded-md bg-slate-100/80 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-slate-700">
                    {candidate.region}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <VulnerabilityPill value={candidate.vulnerabilityStatus} />
                </td>

                <td className="px-4 py-3.5">
                  <span className="text-xs whitespace-nowrap text-slate-500">
                    {candidate.willingToAttendTraining === undefined
                      ? "—"
                      : candidate.willingToAttendTraining
                        ? "Willing"
                        : "Declined"}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <CandidateStatusBadge status={candidate.status} />
                </td>

                <td className="px-4 py-3.5">
                  {candidate.status === "CONTRACT_ISSUED" ? (
                    <span className="flex items-center gap-1 text-xs font-medium whitespace-nowrap text-emerald-700">
                      <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                      Contract Issued
                    </span>
                  ) : candidate.status === "NEW" ? (
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onUpdateStatus(candidate._id, "SHORTLISTED")}
                        className={cn(
                          ACTION_BUTTON,
                          "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {isPending && (
                          <Loader2 className="mr-1 size-3 animate-spin" aria-hidden />
                        )}
                        Shortlist
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onUpdateStatus(candidate._id, "REJECTED")}
                        className={cn(
                          ACTION_BUTTON,
                          "border-transparent text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                        )}
                      >
                        Reject
                      </button>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">&mdash;</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
