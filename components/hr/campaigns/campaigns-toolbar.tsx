"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CAMPAIGN_STATUS_ORDER,
  CAMPAIGN_STATUS_STYLE,
} from "@/components/hr/campaigns/campaign-status";
import { ExportCampaignsCsvButton } from "@/components/hr/campaigns/export-campaigns-csv-button";
import { SEARCH_DEBOUNCE_MS } from "@/components/system/workstation";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { CampaignStatusFilter } from "@/lib/hooks/use-campaign-params";
import type { CampaignQueryFilters } from "@/types/backend";

const CONTROL_CLASS =
  "h-10 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none";

export function CampaignsToolbar({
  token,
  search,
  onSearchChange,
  onClearSearch,
  status,
  onStatusChange,
  exportFilters,
  total,
  resultsRegionId,
  className,
}: {
  token: string;
  search: string;
  onSearchChange: (next: string) => void;
  onClearSearch: () => void;
  status: CampaignStatusFilter;
  onStatusChange: (next: CampaignStatusFilter) => void;
  exportFilters: CampaignQueryFilters;
  total: number;
  resultsRegionId?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(search);
  const [mirroredSearch, setMirroredSearch] = useState(search);
  const debouncedDraft = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS);

  if (search !== mirroredSearch) {
    setMirroredSearch(search);
    if (search !== debouncedDraft) setDraft(search);
  }

  const commitRef = useRef(onSearchChange);
  useEffect(() => {
    commitRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    if (debouncedDraft !== draft) return;
    if (debouncedDraft === search) return;
    commitRef.current(debouncedDraft);
  }, [debouncedDraft, draft, search]);

  function clear() {
    setDraft("");
    if (search !== "") onClearSearch();
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-80 sm:shrink-0">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") clear();
            }}
            placeholder="Search campaigns…"
            aria-label="Search campaigns"
            aria-controls={resultsRegionId}
            autoComplete="off"
            spellCheck={false}
            className={cn(CONTROL_CLASS, "w-full pr-9 pl-9 placeholder:text-slate-400")}
          />
          {draft && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as CampaignStatusFilter)}
        >
          <SelectTrigger
            aria-label="Filter by status"
            className={cn(CONTROL_CLASS, "w-full sm:w-52")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {CAMPAIGN_STATUS_ORDER.map((value) => (
              <SelectItem key={value} value={value}>
                {CAMPAIGN_STATUS_STYLE[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ExportCampaignsCsvButton
        token={token}
        filters={exportFilters}
        total={total}
        className="w-full sm:w-auto"
      />
    </div>
  );
}
