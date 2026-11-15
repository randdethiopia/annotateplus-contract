"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PAGE_LIMITS, type PageLimit } from "@/components/system/workstation";
import { ETHIOPIAN_REGIONS, VULNERABILITY_OPTIONS } from "@/lib/ethiopia";
import type { CandidateStatus } from "@/types/backend";

const DEFAULT_PAGE = 1;
const MAX_PAGE = 10_000;
const MAX_SEARCH = 200;

const STATUS_LOOKUP = new Set<string>([
  "NEW",
  "SHORTLISTED",
  "CONTRACT_ISSUED",
  "REJECTED",
  "ARCHIVED",
] satisfies CandidateStatus[]);

const REGION_LOOKUP = new Set<string>(ETHIOPIAN_REGIONS);
const VULNERABILITY_LOOKUP = new Set<string>(VULNERABILITY_OPTIONS.map((o) => o.value));
const LIMIT_LOOKUP = new Set<number>(PAGE_LIMITS);

export interface CandidateParamValues {
  status: string;
  search: string;
  region: string;
  vulnerabilityStatus: string;
  page: number;
  limit: PageLimit;
}

export interface CandidateParams extends CandidateParamValues {
  setFilters: (patch: Partial<Omit<CandidateParamValues, "page">>) => void;
  setSearch: (next: string) => void;
  setPage: (next: number) => void;
  setLimit: (next: PageLimit) => void;
  resetFilters: () => void;
}

function coerceSearch(raw: string | null): string {
  return (raw ?? "").trim().slice(0, MAX_SEARCH);
}

function coerceFromSet(raw: string | null, lookup: Set<string>): string {
  return raw && lookup.has(raw) ? raw : "";
}

function coercePage(raw: string | null): number {
  if (raw === null || !/^\d{1,7}$/.test(raw)) return DEFAULT_PAGE;
  return Math.min(Math.max(Number(raw), DEFAULT_PAGE), MAX_PAGE);
}

function coerceLimit(raw: string | null, fallback: PageLimit): PageLimit {
  const value = Number(raw);
  return LIMIT_LOOKUP.has(value) ? (value as PageLimit) : fallback;
}

function parseParams(params: URLSearchParams, defaultLimit: PageLimit): CandidateParamValues {
  return {
    status: coerceFromSet(params.get("status"), STATUS_LOOKUP),
    search: coerceSearch(params.get("search")),
    region: coerceFromSet(params.get("region"), REGION_LOOKUP),
    vulnerabilityStatus: coerceFromSet(
      params.get("vulnerabilityStatus"),
      VULNERABILITY_LOOKUP
    ),
    page: coercePage(params.get("page")),
    limit: coerceLimit(params.get("limit"), defaultLimit),
  };
}

function buildQuery(state: CandidateParamValues, defaultLimit: PageLimit): string {
  const query = new URLSearchParams();
  if (state.status) query.set("status", state.status);
  if (state.search) query.set("search", state.search);
  if (state.region) query.set("region", state.region);
  if (state.vulnerabilityStatus) query.set("vulnerabilityStatus", state.vulnerabilityStatus);
  if (state.page !== DEFAULT_PAGE) query.set("page", String(state.page));
  if (state.limit !== defaultLimit) query.set("limit", String(state.limit));
  return query.toString();
}

export function useCandidateParams(defaultLimit: PageLimit = 20): CandidateParams {
  const searchParams = useSearchParams();

  const { status, search, region, vulnerabilityStatus, page, limit } = parseParams(
    new URLSearchParams(searchParams.toString()),
    defaultLimit
  );

  const commit = useCallback(
    (patch: Partial<CandidateParamValues>, mode: "push" | "replace") => {
      const url = new URL(window.location.href);
      const current = parseParams(url.searchParams, defaultLimit);

      const crossesBoundary = (
        ["status", "search", "region", "vulnerabilityStatus", "limit"] as const
      ).some((key) => patch[key] !== undefined && patch[key] !== current[key]);

      const next: CandidateParamValues = {
        ...current,
        ...patch,
        ...(crossesBoundary ? { page: DEFAULT_PAGE } : {}),
      };

      const nextQuery = buildQuery(next, defaultLimit);
      if (nextQuery === url.search.replace(/^\?/, "")) return;

      const href = `${url.pathname}${nextQuery ? `?${nextQuery}` : ""}${url.hash}`;
      if (mode === "push") window.history.pushState(null, "", href);
      else window.history.replaceState(null, "", href);
    },
    [defaultLimit]
  );

  const setFilters = useCallback(
    (patch: Partial<Omit<CandidateParamValues, "page">>) => commit(patch, "push"),
    [commit]
  );

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

  const setLimit = useCallback(
    (next: PageLimit) => commit({ limit: next }, "replace"),
    [commit]
  );

  const resetFilters = useCallback(
    () => commit({ status: "", search: "", region: "", vulnerabilityStatus: "" }, "push"),
    [commit]
  );

  return useMemo(
    () => ({
      status,
      search,
      region,
      vulnerabilityStatus,
      page,
      limit,
      setFilters,
      setSearch,
      setPage,
      setLimit,
      resetFilters,
    }),
    [
      status,
      search,
      region,
      vulnerabilityStatus,
      page,
      limit,
      setFilters,
      setSearch,
      setPage,
      setLimit,
      resetFilters,
    ]
  );
}
