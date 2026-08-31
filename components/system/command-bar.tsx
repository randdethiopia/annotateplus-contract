"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { ContractStatus } from "@/types/backend";

export type QueueFilterValue = ContractStatus | "ALL";

export interface QueueTab {
  value: QueueFilterValue;
  label: string;
  /** Rendered beside the label when set and non-zero. */
  count?: number;
}

/**
 * Debounced search + segmented status tabs. Shared by the HR and finance
 * workstations — only the tab list and placeholder differ.
 */
export function CommandBar({
  search,
  onSearchChange,
  onSearchCommit,
  status,
  onStatusChange,
  tabs,
  searchPlaceholder = "Search name, phone, or contract number…",
  searchLabel = "Search contracts",
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchCommit?: () => void;
  status: QueueFilterValue;
  onStatusChange: (value: QueueFilterValue) => void;
  tabs: QueueTab[];
  searchPlaceholder?: string;
  searchLabel?: string;
}) {
  const [inputValue, setInputValue] = useState(search);
  const [lastSearch, setLastSearch] = useState(search);
  const debouncedInput = useDebouncedValue(inputValue, 300);

  // React's documented "adjust state when a prop changes" pattern: if the parent
  // resets the query, the box follows without an effect.
  if (search !== lastSearch) {
    setLastSearch(search);
    setInputValue(search);
  }

  useEffect(() => {
    if (debouncedInput !== search) {
      onSearchChange(debouncedInput);
      onSearchCommit?.();
    }
  }, [debouncedInput, search, onSearchChange, onSearchCommit]);

  return (
    <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
      <div className="relative w-full sm:w-80 sm:shrink-0">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        {/* type="text", not "search": WebKit's native clear-X would sit right
            beside the custom one below. */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-9 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => setInputValue("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Filter by status"
        // Wraps rather than scrolls: a hidden horizontal overflow means someone
        // on a phone never discovers the last tab.
        className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200/60 bg-slate-100/80 p-1"
      >
        {tabs.map((tab) => {
          const isActive = status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onStatusChange(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none",
                isActive
                  ? "bg-white font-semibold text-slate-900 shadow-xs"
                  : "font-medium text-slate-600 hover:text-slate-900"
              )}
            >
              {tab.label}
              {!!tab.count && <span className="ml-1.5 text-slate-400 tabular">{tab.count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
