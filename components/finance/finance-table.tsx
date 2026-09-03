"use client";

import { useState } from "react";
import { Check, FileDown, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RemindButton } from "@/components/contracts/remind-button";
import { StatusDotLabel } from "@/components/system/status-badge";
import { SURFACE_CARD } from "@/components/system/surface";
import { formatAgreementDate } from "@/lib/format-date";
import { getInitials } from "@/lib/initials";
import { normalizePhoneToLocal } from "@/lib/phone";
import { isRemindable } from "@/lib/reminder-utils";
import { cn } from "@/lib/utils";
import type { FinanceContractListItemDto } from "@/types/backend";

const HEAD_CELL = "px-4 text-left align-middle font-semibold whitespace-nowrap";

const COLUMNS = [
  { label: "Worker", align: "text-left" },
  { label: "Contract & Rate", align: "text-left" },
  { label: "Bank & Payout", align: "text-left" },
  { label: "Status", align: "text-left" },
  { label: "Agreement Date", align: "text-left" },
  { label: "", align: "text-right" },
] as const;

// ── Cell fragments ────────────────────────────────────────────────────────────
// Shared by the desktop grid and the mobile cards so the two renderings of the
// same row can never drift apart.

function WorkerIdentity({ item }: { item: FinanceContractListItemDto }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600"
        aria-hidden
      >
        {getInitials(item.workerName)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {item.workerName ?? "Awaiting submission"}
        </p>
        {item.workerNameAmharic && (
          <p className="font-ethiopic truncate text-xs text-slate-500">
            {item.workerNameAmharic}
          </p>
        )}
        <p className="truncate font-mono text-xs text-slate-400">
          {normalizePhoneToLocal(item.phone)}
        </p>
      </div>
    </div>
  );
}

function ContractAndRate({ item }: { item: FinanceContractListItemDto }) {
  return (
    <>
      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-xs whitespace-nowrap text-slate-700">
        {item.contractNumber}
      </span>
      <p className="mt-1 text-xs font-medium whitespace-nowrap text-slate-500 tabular">
        {item.ratePerTaskEtb.toLocaleString()} ETB / task
      </p>
    </>
  );
}

function BankAndPayout({ item }: { item: FinanceContractListItemDto }) {
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

// Extracted so its `copied` state no longer sits above conditional returns.
function CopyLinkButton({ item }: { item: FinanceContractListItemDto }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(item.inviteLink!);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success("Signing link copied");
        } catch {
          toast.error("Could not copy — your browser blocked clipboard access.");
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none"
    >
      {copied ? (
        <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <Link2 className="size-3.5 shrink-0" aria-hidden />
      )}
      Copy Link
    </button>
  );
}

function RowActions({
  item,
  isDownloading,
  onDownload,
}: {
  item: FinanceContractListItemDto;
  isDownloading: boolean;
  onDownload: (item: FinanceContractListItemDto) => void;
}) {
  // Gate on hasSealedDocument too: a contract can be SIGNED before the PDF is
  // sealed, and offering the download then just 404s.
  if (item.status === "SIGNED" && item.hasSealedDocument) {
    return (
      <button
        type="button"
        disabled={isDownloading}
        aria-label={`Download sealed PDF for ${item.contractNumber}`}
        onClick={(e) => {
          e.stopPropagation();
          onDownload(item);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-600/30 focus-visible:outline-none disabled:opacity-60"
      >
        {isDownloading ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <FileDown className="size-3.5 shrink-0" aria-hidden />
        )}
        Sealed PDF
      </button>
    );
  }

  if (item.status === "PENDING_REVIEW") {
    return (
      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-amber-700">
        Awaiting HR
      </span>
    );
  }

  // Everything below can coexist: an INVITED row offers both the link and the
  // nudge. Copy Link is only offered when the list payload actually carries the
  // link, and `isRemindable` is what RemindButton itself gates on — so this
  // still collapses to nothing rather than an empty flex item.
  const showCopyLink =
    (item.status === "INVITED" || item.status === "DRAFT") && !!item.inviteLink;
  const showRemind = isRemindable(item.status);

  if (!showCopyLink && !showRemind) return null;

  return (
    <div className="flex items-center justify-end gap-2">
      {showCopyLink && <CopyLinkButton item={item} />}
      {showRemind && <RemindButton contract={item} surface="finance" />}
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

/**
 * Rows only. The loading, empty and error states are owned by `QueueShell` —
 * see the note on `HrDataTable`.
 */
export function FinanceTable({
  items,
  downloadingId,
  onDownload,
  onSelect,
}: {
  items: FinanceContractListItemDto[];
  /** contractId of the row whose sealed PDF is currently downloading. */
  downloadingId?: string;
  onDownload: (item: FinanceContractListItemDto) => void;
  onSelect: (item: FinanceContractListItemDto) => void;
}) {
  return (
    <>
      {/* Below lg the six columns become one card per contract. */}
      <ul className="space-y-3 lg:hidden">
        {items.map((item) => (
          <li key={item.contractId} className={cn(SURFACE_CARD, "p-4")}>
            {/* A real button, so the row is keyboard-reachable — it opens a sheet
                rather than navigating, so a link would be wrong here. */}
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="flex w-full items-start justify-between gap-3 text-left focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none"
            >
              <WorkerIdentity item={item} />
              <StatusDotLabel status={item.status} />
            </button>

            <div className="mt-3.5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <ContractAndRate item={item} />
              </div>
              <div className="text-right">
                <BankAndPayout item={item} />
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <span className="text-[11px] text-slate-400">
                {formatAgreementDate(item.agreementDate)}
              </span>
              <RowActions
                item={item}
                isDownloading={downloadingId === item.contractId}
                onDownload={onDownload}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* The grid needs ~900px to breathe, so it appears only from lg. */}
      <div className={cn(SURFACE_CARD, "hidden lg:block")}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="h-10 border-b border-slate-200 bg-slate-50/60 text-[11px] tracking-wider text-slate-500 uppercase">
              {COLUMNS.map((column, i) => (
                <th
                  key={column.label || `actions-${i}`}
                  scope="col"
                  className={cn(HEAD_CELL, column.align, !column.label && "sr-only")}
                >
                  {column.label || "Actions"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.contractId}
                onClick={() => onSelect(item)}
                className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(item);
                    }}
                    className="text-left focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none"
                  >
                    <WorkerIdentity item={item} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <ContractAndRate item={item} />
                </td>
                <td className="px-4 py-3">
                  <BankAndPayout item={item} />
                </td>
                <td className="px-4 py-3">
                  <StatusDotLabel status={item.status} />
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                  {formatAgreementDate(item.agreementDate)}
                </td>
                <td className="px-4 py-3 text-right">
                  <RowActions
                    item={item}
                    isDownloading={downloadingId === item.contractId}
                    onDownload={onDownload}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function FinanceTableSkeleton() {
  return (
    <div className={SURFACE_CARD} aria-busy="true" aria-label="Loading contracts">
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
          <div className="h-7 w-24 shrink-0 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
