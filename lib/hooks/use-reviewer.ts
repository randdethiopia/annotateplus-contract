"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewerApi, type ReviewerContractsParams } from "@/lib/api/reviewer.api";
import type { RejectPayload } from "@/types/backend";

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
    queryKey: ["reviewer-contracts", filters],
    queryFn: () => reviewerApi.getContracts(token, params),
    enabled: !!token,
  });
}

export function useReviewerKpis(token: string) {
  const pendingReviewQuery = useQuery({
    queryKey: ["reviewer-kpis", "pending-review"],
    queryFn: () =>
      reviewerApi.getContracts(token, { status: "PENDING_REVIEW", page: 1, limit: 1 }),
    enabled: !!token,
  });

  const resubmissionQuery = useQuery({
    queryKey: ["reviewer-kpis", "resubmission"],
    queryFn: () =>
      reviewerApi.getContracts(token, { status: "RESUBMISSION_REQUIRED", page: 1, limit: 1 }),
    enabled: !!token,
  });

  const signedQuery = useQuery({
    queryKey: ["reviewer-kpis", "signed"],
    queryFn: () => reviewerApi.getContracts(token, { status: "SIGNED", page: 1, limit: 1 }),
    enabled: !!token,
  });

  const rejectedQuery = useQuery({
    queryKey: ["reviewer-kpis", "rejected"],
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

export function useContractDossier(token: string, id: string) {
  return useQuery({
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
