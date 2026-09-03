"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { RemindButton } from "@/components/contracts/remind-button";
import { StatusDotLabel } from "@/components/system/status-badge";
import { SURFACE_CARD } from "@/components/system/surface";
import { formatAgreementDate } from "@/lib/format-date";
import { getInitials } from "@/lib/initials";
import { normalizePhoneToLocal } from "@/lib/phone";
import { DEFAULT_MAX_ATTEMPTS } from "@/lib/status-actions";
import { cn } from "@/lib/utils";
import type { ContractListItemDto } from "@/types/backend";

const HEAD_CELL = "px-4 text-left align-middle font-semibold whitespace-nowrap";

const COLUMNS = [
  "Candidate",
  "Contract #",
  "Fayda Status",
  "Payout Details",
  "Status",
  "Submitted",
  "",
] as const;

// ── Cell fragments ────────────────────────────────────────────────────────────
// Shared by the desktop grid and the mobile cards so the two renderings of the
// same row can never drift apart.

function CandidateIdentity({ item }: { item: ContractListItemDto }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600"
        aria-hidden
      >
        {getInitials(item.candidateName)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {item.candidateName ?? "Awaiting submission"}
        </p>
        {item.candidateNameAmharic && (
          <p className="font-ethiopic truncate text-xs text-slate-500">
            {item.candidateNameAmharic}
          </p>
        )}
        <p className="truncate font-mono text-xs text-slate-400">
          {normalizePhoneToLocal(item.phone)}
        </p>
      </div>
    </div>
  );
}

function ContractRef({ item }: { item: ContractListItemDto }) {
  return (
    <>
      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-xs whitespace-nowrap text-slate-700">
        {item.contractNumber}
      </span>
      <p className="mt-1 text-[11px] whitespace-nowrap text-slate-400">
        Attempt {item.currentAttemptNumber || 1}/{DEFAULT_MAX_ATTEMPTS}
      </p>
    </>
  );
}

function FaydaCell({ submitted }: { submitted: boolean }) {
  // There is no per-photo flag on the list payload, and there cannot be a
  // submission without both ID sides — so the submission itself is the signal.
  if (!submitted) {
    return (
      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-slate-500">
        Awaiting upload
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-emerald-700">
      <Check className="size-3 shrink-0" aria-hidden />
      Photos Attached
    </span>
  );
}

function PayoutCell({ item }: { item: ContractListItemDto }) {
  if (!item.bankName && !item.bankAccountMasked) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  return (
    <>
      <p className="truncate text-xs font-medium text-slate-700">{item.bankName ?? "—"}</p>
      <p className="font-mono text-xs whitespace-nowrap text-slate-500 tabular">
        {item.bankAccountMasked ?? "—"}
      </p>
    </>
  );
}

function SubmittedLabel({ item }: { item: ContractListItemDto }) {
  return <>{item.submittedAt ? formatAgreementDate(item.submittedAt) : "—"}</>;
}

// ── Public component ──────────────────────────────────────────────────────────

/**
 * Rows only. The loading, empty and error states are owned by `QueueShell`, so
 * that the grid can stay mounted across a page click, filter switch or
 * debounced search instead of being swapped for a skeleton.
 */
export function HrDataTable({ items }: { items: ContractListItemDto[] }) {
  const router = useRouter();

  return (
    <>
      {/* Below lg the seven columns become one card per candidate. The card
          carries its own actions (a reminder can be sent from here), and a
          button nested inside a card-wide link is invalid markup — so the
          identity header is the link and the footer holds the actions, matching
          the finance cards. It stays a link rather than a button so
          middle-click and open-in-new-tab keep working. */}
      <ul className="space-y-3 lg:hidden">
        {items.map((item) => {
          const href = `/hr/${item.contractId}`;
          return (
            <li key={item.contractId} className={cn(SURFACE_CARD, "p-4")}>
              <Link
                href={href}
                className="-m-1 flex items-start justify-between gap-3 rounded-lg p-1 transition-colors hover:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none"
              >
                <CandidateIdentity item={item} />
                <StatusDotLabel status={item.status} />
              </Link>

              <div className="mt-3.5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <ContractRef item={item} />
                </div>
                <div className="text-right">
                  <PayoutCell item={item} />
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <FaydaCell submitted={!!item.submittedAt} />
                <span className="text-[11px] text-slate-400">
                  <SubmittedLabel item={item} />
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <RemindButton contract={item} surface="reviewer" />
                {/* ml-auto keeps Review right-aligned when there is no reminder. */}
                <Link
                  href={href}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  Review
                  <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {/* The grid needs ~900px to breathe, so it appears only from lg. */}
      <div className={cn(SURFACE_CARD, "hidden lg:block")}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="h-10 border-b border-slate-200 bg-slate-50/60 text-[11px] tracking-wider text-slate-500 uppercase">
              {COLUMNS.map((column, i) => (
                <th
                  key={column || `actions-${i}`}
                  scope="col"
                  className={cn(HEAD_CELL, !column && "sr-only")}
                >
                  {column || "Actions"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const href = `/hr/${item.contractId}`;
              return (
                <tr
                  key={item.contractId}
                  onClick={() => router.push(href)}
                  className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-4 py-3">
                    <CandidateIdentity item={item} />
                  </td>
                  <td className="px-4 py-3">
                    <ContractRef item={item} />
                  </td>
                  <td className="px-4 py-3">
                    <FaydaCell submitted={!!item.submittedAt} />
                  </td>
                  <td className="px-4 py-3">
                    <PayoutCell item={item} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusDotLabel status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                    <SubmittedLabel item={item} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <RemindButton contract={item} surface="reviewer" />
                      {/* A real link, so the row stays keyboard-reachable and
                          middle-click/open-in-new-tab keep working. */}
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        Review
                        <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function HrDataTableSkeleton() {
  return (
    <div className={SURFACE_CARD} aria-busy="true" aria-label="Loading the verification queue">
      <div className="hidden h-10 border-b border-slate-200 bg-slate-50/60 lg:block" />
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="flex animate-pulse items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0"
        >
          <div className="size-8 shrink-0 rounded-full bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-full max-w-40 rounded bg-slate-100" />
            <div className="h-2.5 w-24 rounded bg-slate-100" />
          </div>
          <div className="hidden h-3 w-32 rounded bg-slate-100 lg:block" />
          <div className="hidden h-3 w-28 rounded bg-slate-100 lg:block" />
          <div className="h-7 w-16 shrink-0 rounded-lg bg-slate-100 sm:w-20" />
        </div>
      ))}
    </div>
  );
}
