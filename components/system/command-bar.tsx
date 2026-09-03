"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { STATUS_STYLE } from "@/components/system/status-badge";
import { RESULTS_REGION_ID, SEARCH_DEBOUNCE_MS } from "@/components/system/workstation";
import { cn } from "@/lib/utils";
import type { ContractStatus } from "@/types/backend";

export type QueueFilterValue = ContractStatus | "ALL";

export interface QueueTab {
  value: QueueFilterValue;
  label: string;
  /** Rendered beside the label whenever defined — including a genuine 0. */
  count?: number;
}

/**
 * Default label for a filter, taken from STATUS_STYLE so a filter and the row
 * badge it selects for can never disagree on what a status is called.
 */
export function statusFilterLabel(value: QueueFilterValue): string {
  return value === "ALL" ? "All" : STATUS_STYLE[value].label;
}

/**
 * True when a keystroke would land somewhere it belongs, or when an overlay
 * owns the keyboard. Either way the "/" shortcut must stand down.
 */
function shouldIgnoreSlash(event: globalThis.KeyboardEvent): boolean {
  if (event.defaultPrevented) return true;
  const node = (event.target instanceof HTMLElement ? event.target : null) ?? document.activeElement;
  if (!(node instanceof HTMLElement)) return false;
  if (node.isContentEditable) return true;
  if (node.tagName === "INPUT" || node.tagName === "TEXTAREA" || node.tagName === "SELECT") {
    return true;
  }
  // Radix Select typeahead, menus, dialogs: "/" belongs to them while open.
  return !!node.closest("[role='listbox'],[role='menu'],[role='dialog'],[role='combobox']");
}

/**
 * Search + status filters + an optional action slot. Shared by all three
 * workstations; only the filter list, placeholder and actions differ.
 *
 * The URL is the source of truth for `search`. This component holds a local
 * draft purely so typing is instant, and pushes it up after
 * SEARCH_DEBOUNCE_MS — or immediately on Enter, Escape, or the clear button.
 */
export function CommandBar({
  search,
  onSearchChange,
  onClearSearch,
  status,
  onStatusChange,
  tabs,
  searchPlaceholder = "Search name, phone, or contract number…",
  searchLabel = "Search contracts",
  actions,
  resultsRegionId = RESULTS_REGION_ID,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onClearSearch?: () => void;
  status: QueueFilterValue;
  onStatusChange: (value: QueueFilterValue) => void;
  tabs: QueueTab[];
  searchPlaceholder?: string;
  searchLabel?: string;
  actions?: ReactNode;
  resultsRegionId?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState(search);
  /** The last `search` prop this component has reacted to. */
  const [mirroredSearch, setMirroredSearch] = useState(search);
  const debouncedDraft = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS);

  // React's documented "adjust state when a prop changes" pattern. Refills the
  // box only when the URL moved without us — back/forward, a deep link, an
  // external reset — and never on the echo of a commit we just made.
  //
  // `search !== debouncedDraft` is what tells those apart: the echo of our own
  // commit is by definition equal to the value we committed, which is
  // `debouncedDraft`. Anything else came from outside. Without this, typing
  // "abcd" quickly loses the "d": at 350ms the commit for "abc" lands, `search`
  // becomes "abc", and a blind resync overwrites the box.
  if (search !== mirroredSearch) {
    setMirroredSearch(search);
    if (search !== debouncedDraft) setDraft(search);
  }

  // Latest-callback ref, so an unstable `onSearchChange` identity at the call
  // site cannot re-fire a commit. The old version put an inline-arrow
  // `onSearchCommit` straight into the effect's dep array.
  const commitRef = useRef(onSearchChange);
  useEffect(() => {
    commitRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    // The debounce has not caught up with the box yet. Without this the effect
    // would fire on a back-button resync and push the pre-navigation keystrokes
    // straight back over it.
    if (debouncedDraft !== draft) return;
    // The URL already says this; committing again would churn history for nothing.
    if (debouncedDraft === search) return;
    commitRef.current(debouncedDraft);
  }, [debouncedDraft, draft, search]);

  /** Skip the debounce entirely: the clear button, Enter, and Escape. */
  function commitNow(value: string) {
    setDraft(value);
    if (value === search) return;
    if (value === "" && onClearSearch) onClearSearch();
    else onSearchChange(value);
  }

  function handleClear() {
    commitNow("");
    // Focus survives the clear, so the next query is one keystroke away.
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitNow(draft);
    } else if (event.key === "Escape" && draft) {
      event.preventDefault();
      handleClear();
    }
  }

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      // `shiftKey` is deliberately not excluded: on a US layout Shift+/ produces
      // "?", which `event.key === "/"` already rules out, while on German and
      // French layouts "/" *is* a shifted key.
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (shouldIgnoreSlash(event)) return;
      const input = inputRef.current;
      // Pulling focus out of an open dialog would be a focus-trap escape.
      if (!input || input.closest("[aria-hidden='true']")) return;
      event.preventDefault(); // or the "/" lands in the box we just focused
      input.focus();
      input.select();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const searchField = (
    <div className="relative w-full sm:w-80 sm:shrink-0">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      {/* type="text", not "search": WebKit's native clear-X would sit right
          beside the custom one below. */}
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={searchPlaceholder}
        aria-label={searchLabel}
        aria-controls={resultsRegionId}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-9 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
      />
      {draft ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        // Shares the slot with the clear button, so the hint disappears exactly
        // when the affordance it advertises becomes irrelevant.
        <kbd
          className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 sm:block"
          aria-hidden
        >
          /
        </kbd>
      )}
    </div>
  );

  const filterGroup = (
    // role="group" with aria-pressed rather than a tablist: these are toggles
    // over one persistent grid, not tabs over swapped panels. There is no
    // tabpanel to point at, ARIA tabs would mandate roving-tabindex arrow
    // navigation that was never implemented, and this matches the aria-pressed
    // pills admin already used.
    <div
      role="group"
      aria-label="Filter by status"
      // Wraps rather than scrolls: a hidden horizontal overflow means someone on
      // a phone never discovers the last filter.
      className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200/60 bg-slate-100/80 p-1"
    >
      {tabs.map((tab) => {
        const isActive = status === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={isActive}
            aria-controls={resultsRegionId}
            onClick={() => onStatusChange(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none",
              isActive
                ? "bg-white font-semibold text-slate-900 shadow-xs"
                : "font-medium text-slate-600 hover:text-slate-900"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              // min-w reserves the digit slot, so a count arriving after the
              // first paint does not reflow the whole group.
              <span className="ml-1.5 inline-block min-w-[1ch] text-slate-400 tabular">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // One row when the page has no bar-level actions (HR, finance) — identical to
  // the previous layout. Two rows when it does (admin), because seven filters
  // plus an export button never fit beside a 320px search field.
  if (!actions) {
    return (
      <div
        className={cn(
          "flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center",
          className
        )}
      >
        {searchField}
        {filterGroup}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchField}
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
      {filterGroup}
    </div>
  );
}
