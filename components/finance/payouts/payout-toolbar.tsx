"use client";

import { Search, X } from "lucide-react";
import { CsvUploadSheet } from "@/components/finance/payouts/csv-upload-sheet";
import { SinglePayoutDialog } from "@/components/finance/payouts/single-payout-dialog";
import { cn } from "@/lib/utils";

export function PayoutToolbar({
  token,
  search,
  onSearchChange,
  onStaged,
  resultsRegionId,
  className,
}: {
  token: string;
  search: string;
  onSearchChange: (next: string) => void;
  onStaged: (batchId: string) => void;
  resultsRegionId?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <div className="relative w-full sm:w-80 sm:shrink-0">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search worker, contract or account…"
          aria-label="Search payout rows"
          aria-controls={resultsRegionId}
          autoComplete="off"
          spellCheck={false}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-9 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CsvUploadSheet token={token} onStaged={onStaged} />
        <SinglePayoutDialog token={token} />
      </div>
    </div>
  );
}
