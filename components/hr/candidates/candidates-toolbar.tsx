"use client";

import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTROL_COMPACT } from "@/components/system/control-styles";
import { ETHIOPIAN_REGIONS, VULNERABILITY_OPTIONS } from "@/lib/ethiopia";
import { cn } from "@/lib/utils";
import { CANDIDATE_STATUS_STYLE, CANDIDATE_STATUS_VALUES } from "@/components/candidates/candidate-status";

export const ALL = "ALL";

export interface CandidateFilters {
  search: string;
  status: string;
  region: string;
  vulnerabilityStatus: string;
}

export const EMPTY_FILTERS: CandidateFilters = {
  search: "",
  status: "",
  region: "",
  vulnerabilityStatus: "",
};

const TRIGGER =
  "h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs data-[size=default]:h-10 focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10";

const CONTENT = "max-h-72 rounded-2xl border-slate-200/90 bg-white p-1.5 shadow-lg";

const ITEM = "cursor-pointer rounded-lg px-3 py-2 text-xs focus:bg-slate-50";

export function CandidatesToolbar({
  filters,
  onChange,
  onReset,
}: {
  filters: CandidateFilters;
  onChange: (next: Partial<CandidateFilters>) => void;
  onReset: () => void;
}) {
  const hasFilters =
    filters.search.trim().length > 0 ||
    filters.status.length > 0 ||
    filters.region.length > 0 ||
    filters.vulnerabilityStatus.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs">
      <div className="relative min-w-[200px] flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Search by name or phone..."
          aria-label="Search candidates"
          className={cn(CONTROL_COMPACT, "pl-8")}
        />
      </div>

      <Select
        value={filters.status || ALL}
        onValueChange={(next) => onChange({ status: next === ALL ? "" : next })}
      >
        <SelectTrigger aria-label="Filter by status" className={cn(TRIGGER, "w-40")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start" className={CONTENT}>
          <SelectItem value={ALL} className={ITEM}>
            All Statuses
          </SelectItem>
          {CANDIDATE_STATUS_VALUES.map((status) => (
            <SelectItem key={status} value={status} className={ITEM}>
              {CANDIDATE_STATUS_STYLE[status].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.region || ALL}
        onValueChange={(next) => onChange({ region: next === ALL ? "" : next })}
      >
        <SelectTrigger aria-label="Filter by region" className={cn(TRIGGER, "w-40")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start" className={CONTENT}>
          <SelectItem value={ALL} className={ITEM}>
            All Regions
          </SelectItem>
          {ETHIOPIAN_REGIONS.map((region) => (
            <SelectItem key={region} value={region} className={ITEM}>
              {region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.vulnerabilityStatus || ALL}
        onValueChange={(next) => onChange({ vulnerabilityStatus: next === ALL ? "" : next })}
      >
        <SelectTrigger aria-label="Filter by demographic" className={cn(TRIGGER, "w-44")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start" className={CONTENT}>
          <SelectItem value={ALL} className={ITEM}>
            All Demographics
          </SelectItem>
          {VULNERABILITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className={ITEM}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
        >
          <X className="size-3.5" aria-hidden />
          Reset filters
        </button>
      )}
    </div>
  );
}
