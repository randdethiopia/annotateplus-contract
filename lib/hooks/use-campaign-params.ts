"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PAGE_LIMITS, type PageLimit } from "@/components/system/workstation";
import type { CampaignStatus } from "@/types/backend";

export type CampaignStatusFilter = CampaignStatus | "ALL";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT: PageLimit = 20;
const MAX_PAGE = 10_000;
const MAX_SEARCH = 200;
const MAX_PROJECT_CODE = 64;

const STATUS_TABLE: Record<CampaignStatusFilter, true> = {
  ALL: true,
  DRAFT: true,
  PENDING_APPROVAL: true,
  APPROVED_BY_MANAGER: true,
  DISBURSING: true,
  PARTIALLY_DISBURSED: true,
  DISBURSED: true,
  FAILED: true,
  CANCELLED: true,
};

const STATUS_LOOKUP = new Set<string>(Object.keys(STATUS_TABLE));
const LIMIT_LOOKUP = new Set<number>(PAGE_LIMITS);

export interface CampaignParamValues {
  status: CampaignStatusFilter;
  search: string;
  projectCode: string;
  page: number;
  limit: PageLimit;
}

function coerceText(raw: string | null, max: number): string {
  return (raw ?? "").trim().slice(0, max);
}

function coercePage(raw: string | null): number {
  if (raw === null) return DEFAULT_PAGE;
  if (!/^\d{1,7}$/.test(raw)) return DEFAULT_PAGE;
  return Math.min(Math.max(Number(raw), DEFAULT_PAGE), MAX_PAGE);
}

function coerceLimit(raw: string | null): PageLimit {
  if (raw === null) return DEFAULT_LIMIT;
  const value = Number(raw);
  return LIMIT_LOOKUP.has(value) ? (value as PageLimit) : DEFAULT_LIMIT;
}

function parseParams(sp: URLSearchParams): CampaignParamValues {
  const status = sp.get("status");
  return {
    status: status !== null && STATUS_LOOKUP.has(status) ? (status as CampaignStatusFilter) : "ALL",
    search: coerceText(sp.get("search"), MAX_SEARCH),
    projectCode: coerceText(sp.get("projectCode"), MAX_PROJECT_CODE),
    page: coercePage(sp.get("page")),
    limit: coerceLimit(sp.get("limit")),
  };
}

function buildQuery(state: CampaignParamValues): string {
  const query = new URLSearchParams();
  if (state.status !== "ALL") query.set("status", state.status);
  if (state.search !== "") query.set("search", state.search);
  if (state.projectCode !== "") query.set("projectCode", state.projectCode);
  if (state.page !== DEFAULT_PAGE) query.set("page", String(state.page));
  if (state.limit !== DEFAULT_LIMIT) query.set("limit", String(state.limit));
  return query.toString();
}

export interface CampaignParams extends CampaignParamValues {
  hasFilters: boolean;
  setStatus: (next: CampaignStatusFilter) => void;
  setSearch: (next: string) => void;
  setProjectCode: (next: string) => void;
  setPage: (next: number) => void;
  setLimit: (next: PageLimit) => void;
  clearSearch: () => void;
  clearAll: () => void;
}

export function useCampaignParams(): CampaignParams {
  const searchParams = useSearchParams();
  const { status, search, projectCode, page, limit } = parseParams(
    new URLSearchParams(searchParams.toString())
  );

  const commit = useCallback((patch: Partial<CampaignParamValues>, mode: "push" | "replace") => {
    const url = new URL(window.location.href);
    const current = parseParams(url.searchParams);

    const crossesBoundary =
      (patch.status !== undefined && patch.status !== current.status) ||
      (patch.search !== undefined && patch.search !== current.search) ||
      (patch.projectCode !== undefined && patch.projectCode !== current.projectCode) ||
      (patch.limit !== undefined && patch.limit !== current.limit);

    const next: CampaignParamValues = {
      ...current,
      ...patch,
      ...(crossesBoundary ? { page: DEFAULT_PAGE } : {}),
    };

    const nextQuery = buildQuery(next);
    const currentQuery = url.search.replace(/^\?/, "");
    if (nextQuery === currentQuery) return;

    const href = `${url.pathname}${nextQuery ? `?${nextQuery}` : ""}${url.hash}`;
    if (mode === "push") window.history.pushState(null, "", href);
    else window.history.replaceState(null, "", href);
  }, []);

  const setStatus = useCallback(
    (next: CampaignStatusFilter) => commit({ status: next }, "push"),
    [commit]
  );
  const setSearch = useCallback(
    (next: string) => commit({ search: coerceText(next, MAX_SEARCH) }, "replace"),
    [commit]
  );
  const setProjectCode = useCallback(
    (next: string) => commit({ projectCode: coerceText(next, MAX_PROJECT_CODE) }, "replace"),
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
  const clearAll = useCallback(
    () => commit({ status: "ALL", search: "", projectCode: "" }, "push"),
    [commit]
  );

  const hasFilters = status !== "ALL" || search !== "" || projectCode !== "";

  return useMemo(
    () => ({
      status,
      search,
      projectCode,
      page,
      limit,
      hasFilters,
      setStatus,
      setSearch,
      setProjectCode,
      setPage,
      setLimit,
      clearSearch,
      clearAll,
    }),
    [
      status,
      search,
      projectCode,
      page,
      limit,
      hasFilters,
      setStatus,
      setSearch,
      setProjectCode,
      setPage,
      setLimit,
      clearSearch,
      clearAll,
    ]
  );
}
