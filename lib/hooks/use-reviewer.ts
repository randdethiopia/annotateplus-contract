"use client";

import { useCallback, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewerApi, type ReviewerContractsParams } from "@/lib/api/reviewer.api";
import type { ContractStatus, RejectPayload } from "@/types/backend";

function invalidateReviewerMutations(
  queryClient: ReturnType<typeof useQueryClient>,
  contractId: string
) {
  queryClient.invalidateQueries({ queryKey: ["reviewer-contracts"] });
  queryClient.invalidateQueries({ queryKey: ["reviewer-contract", contractId] });
  queryClient.invalidateQueries({ queryKey: ["reviewer-kpis"] });
  queryClient.invalidateQueries({ queryKey: ["finance-contracts"] });
}

export function useReviewerContracts(token: string, params: ReviewerContractsParams) {
  const filters = {
    status: params.status,
    search: params.search?.trim() || undefined,
    page: params.page,
    limit: params.limit,
  };

  return useQuery({
    // `token` scopes the cache to one user — it was previously closed over in
    // queryFn but absent from the key, so switching users without a hard reload
    // could serve the previous user's rows. It sits before `filters` so the
    // prefix-match invalidations below still hit.
    queryKey: ["reviewer-contracts", token, filters],
    // The trimmed search, so "ab" and "ab " cannot be one cache entry serving
    // two different requests.
    queryFn: () => reviewerApi.getContracts(token, { ...params, search: filters.search }),
    enabled: !!token,
    // Rows stay on screen through a page click, filter switch or debounced
    // search instead of being replaced by a skeleton.
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Per-status totals for the whole filtered set, not just the rows on screen.
 * Same shape as `useReviewerKpis` below — a `limit: 1` request read for its
 * `total`. Scoped to the active search but deliberately not to the active
 * status, since these tiles *are* the status breakdown.
 */
export function useReviewerStatusCounts(
  token: string,
  statuses: ContractStatus[],
  search?: string
) {
  const trimmed = search?.trim() || undefined;

  const results = useQuery({
    queryKey: ["reviewer-kpis", "status-counts", token, statuses, trimmed],
    queryFn: async () => {
      const totals = await Promise.all(
        statuses.map((status) =>
          reviewerApi
            .getContracts(token, { status, search: trimmed, page: 1, limit: 1 })
            .then((page) => [status, page.total] as const)
        )
      );
      return Object.fromEntries(totals) as Record<string, number>;
    },
    enabled: !!token && statuses.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  return { counts: results.data, isLoading: results.isPending };
}

export function useReviewerKpis(token: string) {
  const pendingReviewQuery = useQuery({
    queryKey: ["reviewer-kpis", "pending-review", token],
    queryFn: () =>
      reviewerApi.getContracts(token, { status: "PENDING_REVIEW", page: 1, limit: 1 }),
    enabled: !!token,
  });

  const resubmissionQuery = useQuery({
    queryKey: ["reviewer-kpis", "resubmission", token],
    queryFn: () =>
      reviewerApi.getContracts(token, { status: "RESUBMISSION_REQUIRED", page: 1, limit: 1 }),
    enabled: !!token,
  });

  const signedQuery = useQuery({
    queryKey: ["reviewer-kpis", "signed", token],
    queryFn: () => reviewerApi.getContracts(token, { status: "SIGNED", page: 1, limit: 1 }),
    enabled: !!token,
  });

  const rejectedQuery = useQuery({
    queryKey: ["reviewer-kpis", "rejected", token],
    queryFn: () => reviewerApi.getContracts(token, { status: "REJECTED", page: 1, limit: 1 }),
    enabled: !!token,
  });

  return {
    pendingReview: pendingReviewQuery.data?.total ?? 0,
    resubmissionRequired: resubmissionQuery.data?.total ?? 0,
    totalVerified: signedQuery.data?.total ?? 0,
    totalRejected: rejectedQuery.data?.total ?? 0,
    isLoading:
      pendingReviewQuery.isLoading ||
      resubmissionQuery.isLoading ||
      signedQuery.isLoading ||
      rejectedQuery.isLoading,
  };
}

/**
 * Manual refresh for the review queue. Rows and the metric strip are backed by
 * two different key families, so a refresh has to move both or the counts drift
 * away from the rows they describe.
 */
export function useRefreshReviewerQueue() {
  const queryClient = useQueryClient();
  // Local state rather than `useIsFetching`: now that the queue refetches on
  // every debounced keystroke, filter switch and page click, a global
  // fetch-count would leave the Refresh button spinning and disabled while the
  // user types. This tracks only refreshes the button itself started.
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reviewer-contracts"] }),
        queryClient.invalidateQueries({ queryKey: ["reviewer-kpis"] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  return { refresh, isRefreshing };
}

export function useContractDossier(token: string, id: string) {
  return useQuery({
    // No `token` here, unlike the list and KPI keys: `gcTime: 0` evicts this the
    // moment it unmounts, so there is nothing to leak across users — and adding
    // it would break the targeted invalidation above, which matches on
    // ["reviewer-contract", contractId].
    queryKey: ["reviewer-contract", id],
    queryFn: () => reviewerApi.getContractDossier(token, id),
    enabled: !!token && !!id,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useApproveContract(token: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reviewerApi.approveContract(token, id),
    onSuccess: () => invalidateReviewerMutations(queryClient, id),
  });
}

export function useRejectContract(token: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RejectPayload) => reviewerApi.rejectContract(token, id, payload),
    onSuccess: () => invalidateReviewerMutations(queryClient, id),
  });
}

export function useRetrySealing(token: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reviewerApi.retrySealing(token, id),
    onSuccess: () => invalidateReviewerMutations(queryClient, id),
  });
}
