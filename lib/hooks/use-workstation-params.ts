"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PAGE_LIMITS, type PageLimit } from "@/components/system/workstation";
import type { ContractStatus } from "@/types/backend";

/** Structurally identical to `QueueFilterValue`, so it is assignable without a cast. */
export type StatusFilter = ContractStatus | "ALL";

const DEFAULT_PAGE = 1;
const MAX_PAGE = 10_000;
const MAX_SEARCH = 200;

/**
 * Exhaustiveness gate. TypeScript checks `Record<StatusFilter, true>` in both
 * directions: a new member of `ContractStatus` fails to compile here (missing
 * key) and a typo fails too (excess property). Runtime lookups go through the
 * Set below, never this object — `STATUS_TABLE["toString"]` is truthy via
 * Object.prototype, which is exactly the hole a hostile `?status=` walks through.
 */
const STATUS_TABLE: Record<StatusFilter, true> = {
  ALL: true,
  DRAFT: true,
  INVITED: true,
  VIEWED: true,
  PENDING_REVIEW: true,
  APPROVED: true,
  REJECTED: true,
  RESUBMISSION_REQUIRED: true,
  SIGNED: true,
  PDF_GENERATION_FAILED: true,
  EXPIRED: true,
  CANCELLED: true,
};

const STATUS_LOOKUP = new Set<string>(Object.keys(STATUS_TABLE));
const LIMIT_LOOKUP = new Set<number>(PAGE_LIMITS);

// ── Parse: tolerant. Untrusted URL in, always-valid state out. ────────────────

interface Defaults {
  status: StatusFilter;
  limit: PageLimit;
}

export interface WorkstationParamValues {
  status: StatusFilter;
  search: string;
  page: number;
  limit: PageLimit;
}

function coerceSearch(raw: string | null): string {
  // Trimmed so `?search=%20%20` is the default state rather than a filter that
  // matches nothing; capped so the query key and upstream request stay bounded.
  return (raw ?? "").trim().slice(0, MAX_SEARCH);
}

function coercePage(raw: string | null): number {
  if (raw === null) return DEFAULT_PAGE;
  // Digits only: rejects "-4", "1abc", "1e9", "", " ", "NaN", "Infinity".
  // `Number()` alone is far too permissive at a trust boundary.
  if (!/^\d{1,7}$/.test(raw)) return DEFAULT_PAGE;
  return Math.min(Math.max(Number(raw), DEFAULT_PAGE), MAX_PAGE);
}

function coerceLimit(raw: string | null, fallback: PageLimit): PageLimit {
  if (raw === null) return fallback;
  const value = Number(raw);
  return LIMIT_LOOKUP.has(value) ? (value as PageLimit) : fallback;
}

function parseParams(sp: URLSearchParams, defaults: Defaults): WorkstationParamValues {
  const status = sp.get("status");
  return {
    status:
      status !== null && STATUS_LOOKUP.has(status) ? (status as StatusFilter) : defaults.status,
    search: coerceSearch(sp.get("search")),
    page: coercePage(sp.get("page")),
    limit: coerceLimit(sp.get("limit"), defaults.limit),
  };
}

// ── Serialize: canonical. The single writer. ──────────────────────────────────

function buildQuery(state: WorkstationParamValues, defaults: Defaults): string {
  const query = new URLSearchParams();
  // Insertion order IS serialization order, so equal state always yields a
  // byte-identical string — which is what the no-op guard in `commit` relies on.
  // Every key equal to its default is dropped, keeping `/hr` as `/hr` rather
  // than `/hr?status=PENDING_REVIEW&search=&page=1&limit=20`.
  if (state.status !== defaults.status) query.set("status", state.status);
  if (state.search !== "") query.set("search", state.search);
  if (state.page !== DEFAULT_PAGE) query.set("page", String(state.page));
  if (state.limit !== defaults.limit) query.set("limit", String(state.limit));
  return query.toString();
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseWorkstationParamsOptions {
  /** HR: "PENDING_REVIEW". Finance: "SIGNED". Admin: "ALL". */
  defaultStatus?: StatusFilter;
  defaultLimit?: PageLimit;
}

export interface WorkstationParams extends WorkstationParamValues {
  setStatus: (next: StatusFilter) => void;
  setSearch: (next: string) => void;
  setPage: (next: number) => void;
  setLimit: (next: PageLimit) => void;
  clearSearch: () => void;
}

/**
 * The URL is the only store for queue state. Values are read reactively from
 * `useSearchParams()`; writes go through the native History API, which Next
 * patches to feed `ACTION_RESTORE` back into the router — so a write re-renders
 * without an RSC round-trip and without disturbing scroll.
 *
 * Writes are NOT synchronous: Next dispatches inside `startTransition`, so
 * reading `status` in the same tick as `setStatus(x)` still yields the old
 * value. Derive the next value, never read it back.
 */
export function useWorkstationParams({
  defaultStatus = "ALL",
  defaultLimit = 20,
}: UseWorkstationParamsOptions = {}): WorkstationParams {
  const searchParams = useSearchParams();

  // Four Set/regex probes — cheaper than the `useMemo` that would guard them.
  // The memo that matters is the one on the returned object.
  const { status, search, page, limit } = parseParams(
    // `useSearchParams` hands back a ReadonlyURLSearchParams, which reads the
    // same but is not assignable to URLSearchParams.
    new URLSearchParams(searchParams.toString()),
    { status: defaultStatus, limit: defaultLimit }
  );

  const commit = useCallback(
    (patch: Partial<WorkstationParamValues>, mode: "push" | "replace") => {
      const defaults: Defaults = { status: defaultStatus, limit: defaultLimit };

      // Read the LIVE URL, not a render snapshot. This is what keeps the
      // callback immune to staleness and lets its dep array be two primitives —
      // so its identity is stable for the whole mount, even though
      // `useSearchParams()` returns a fresh object on every navigation.
      const url = new URL(window.location.href);
      const current = parseParams(url.searchParams, defaults);

      // Boundary auto-reset, enforced once so no call site can forget it. Gated
      // on real inequality: re-clicking the already-active status tab must not
      // yank the user back to page 1.
      const crossesBoundary =
        (patch.status !== undefined && patch.status !== current.status) ||
        (patch.search !== undefined && patch.search !== current.search) ||
        (patch.limit !== undefined && patch.limit !== current.limit);

      const next: WorkstationParamValues = {
        ...current,
        ...patch,
        // Spread last so the reset always wins over an explicit `page` in the
        // same patch.
        ...(crossesBoundary ? { page: DEFAULT_PAGE } : {}),
      };

      const nextQuery = buildQuery(next, defaults);
      const currentQuery = url.search.replace(/^\?/, "");

      // Next dispatches ACTION_RESTORE on every patched history write that
      // carries a url — including an identical one. Without this guard a
      // re-firing debounce upstream drives the router reducer in a loop.
      if (nextQuery === currentQuery) return;

      // `window.location.pathname`, not `usePathname()`: a history write needs
      // the path WITH any basePath, and `usePathname` strips it.
      const href = `${url.pathname}${nextQuery ? `?${nextQuery}` : ""}${url.hash}`;

      // `data` must be free of `__NA` and `_N` — Next reads those as its own
      // internal calls and skips the router update, which would move the address
      // bar without re-rendering. `null` is correct: the patch copies Next's
      // internal history state forward itself.
      if (mode === "push") window.history.pushState(null, "", href);
      else window.history.replaceState(null, "", href);
    },
    [defaultStatus, defaultLimit]
  );

  // A status switch is a deliberate destination → push.
  const setStatus = useCallback(
    (next: StatusFilter) => commit({ status: next }, "push"),
    [commit]
  );
  // Typing, paging and page size are refinements of one view → replace, so a
  // typed word does not leave ten entries on the history stack.
  const setSearch = useCallback(
    (next: string) => commit({ search: coerceSearch(next) }, "replace"),
    [commit]
  );
  const setPage = useCallback(
    (next: number) =>
      commit(
        { page: Math.min(Math.max(Math.trunc(next) || DEFAULT_PAGE, DEFAULT_PAGE), MAX_PAGE) },
        "replace"
      ),
    [commit]
  );
  const setLimit = useCallback((next: PageLimit) => commit({ limit: next }, "replace"), [commit]);
  const clearSearch = useCallback(() => commit({ search: "" }, "replace"), [commit]);

  // Memoized on primitives plus permanently-stable callbacks, so the returned
  // object's identity changes only when a value actually changes — safe to drop
  // whole into a dependency array.
  return useMemo(
    () => ({ status, search, page, limit, setStatus, setSearch, setPage, setLimit, clearSearch }),
    [status, search, page, limit, setStatus, setSearch, setPage, setLimit, clearSearch]
  );
}
