"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { STATUS_STYLE } from "@/components/system/status-badge";
import type { ContractStatus } from "@/types/backend";

export type FilterValue = ContractStatus | "ALL";

/** Pill labels default to STATUS_STYLE so filter chips and badges never drift apart. */
export function pillLabel(value: FilterValue): string {
  return value === "ALL" ? "All" : STATUS_STYLE[value].label;
}

/**
 * Debounced search + status pills + action slot.
 * Replaces three near-identical copies of this block (HR, finance, admin).
 */
export function Omnibar({
  search,
  onSearchChange,
  onSearchCommit,
  status,
  onStatusChange,
  pills,
  searchPlaceholder = "Search name, phone, or contract number…",
  actions,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchCommit?: () => void;
  status: FilterValue;
  onStatusChange: (value: FilterValue) => void;
  pills: FilterValue[];
  searchPlaceholder?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const [inputValue, setInputValue] = useState(search);
  const [lastSearch, setLastSearch] = useState(search);
  const debouncedInput = useDebouncedValue(inputValue, 300);

  // React's documented "adjust state when a prop changes" pattern: if the parent
  // resets the query (e.g. clearing filters), the box follows without an effect.
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
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pr-10 pl-10"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => setInputValue("")}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <div className="-mx-1 flex flex-wrap gap-2 px-1">
        {pills.map((pill) => {
          const isActive = status === pill;
          return (
            <button
              key={pill}
              type="button"
              onClick={() => onStatusChange(pill)}
              aria-pressed={isActive}
              className={cn(
                "focus-visible:ring-ring rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                isActive
                  ? "bg-action text-action-foreground"
                  : "bg-muted text-foreground/70 hover:bg-border hover:text-foreground"
              )}
            >
              {pillLabel(pill)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
