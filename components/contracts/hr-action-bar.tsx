"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExportReviewerCsvButton } from "@/components/contracts/export-reviewer-csv-button";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { ContractListItemDto, ContractStatus } from "@/types/backend";

const FILTER_PILLS: (ContractStatus | "ALL")[] = [
  "ALL",
  "PENDING_REVIEW",
  "RESUBMISSION_REQUIRED",
  "SIGNED",
  "REJECTED",
];

const PILL_LABELS: Record<string, string> = {
  ALL: "ALL",
  PENDING_REVIEW: "PENDING REVIEW",
  RESUBMISSION_REQUIRED: "RESUBMISSION",
  SIGNED: "SIGNED",
  REJECTED: "REJECTED",
};

export function HrActionBar({
  search,
  onSearchChange,
  onSearchCommit,
  status,
  onStatusChange,
  items,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchCommit?: () => void;
  status: ContractStatus | "ALL";
  onStatusChange: (value: ContractStatus | "ALL") => void;
  items: ContractListItemDto[];
}) {
  const [inputValue, setInputValue] = useState(search);
  const debouncedInput = useDebouncedValue(inputValue, 300);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  useEffect(() => {
    if (debouncedInput !== search) {
      onSearchChange(debouncedInput);
      onSearchCommit?.();
    }
  }, [debouncedInput, search, onSearchChange, onSearchCommit]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search name, phone, or contract number…"
            className="h-11 pl-9"
          />
        </div>
        <ExportReviewerCsvButton items={items} fileName="hr-contracts.csv" />
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => onStatusChange(pill)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
              status === pill
                ? "bg-[#69B34C]/10 text-[#3B6A22]"
                : "bg-[#F4F4F5] text-[#1A4428]/70 hover:bg-[#E8E8E7]"
            )}
          >
            {PILL_LABELS[pill]}
          </button>
        ))}
      </div>
    </div>
  );
}
