"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  financeApi,
  type ExportPipelineParams,
  type FinanceContractsParams,
} from "@/lib/api/finance.api";
import type { CreateContractInput } from "@/lib/validations/contract.schema";
import type { BulkRemindParams } from "@/types/backend";

export function useFinanceContracts(token: string, params: FinanceContractsParams) {
  const filters = {
    status: params.status,
    search: params.search?.trim() || undefined,
    reminderEligible: params.reminderEligible || undefined,
    page: params.page,
    limit: params.limit,
  };

  return useQuery({
    // See the note in use-reviewer.ts: `token` scopes the cache to one user and
    // sits before `filters` so prefix-match invalidations still hit.
    queryKey: ["finance-contracts", token, filters],
    queryFn: () => financeApi.getContracts(token, { ...params, search: filters.search }),
    enabled: !!token,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

export function useFinanceSummary(token: string) {
  return useQuery({
    queryKey: ["finance-summary", token],
    queryFn: () => financeApi.getSummary(token),
    enabled: !!token,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useBulkRemind(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: BulkRemindParams) => financeApi.bulkRemind(token, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["reviewer-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["reviewer-kpis"] });
    },
  });
}

export function useFinanceKpis(token: string) {
  const signedCountQuery = useQuery({
    queryKey: ["finance-kpis", "signed-count", token],
    queryFn: () =>
      financeApi.getContracts(token, { status: "SIGNED", page: 1, limit: 1 }),
    enabled: !!token,
  });

  const pendingReviewQuery = useQuery({
    queryKey: ["finance-kpis", "pending-review", token],
    queryFn: () =>
      financeApi.getContracts(token, { status: "PENDING_REVIEW", page: 1, limit: 1 }),
    enabled: !!token,
  });

  const draftsQuery = useQuery({
    queryKey: ["finance-kpis", "drafts", token],
    queryFn: () => financeApi.getContracts(token, { status: "DRAFT", page: 1, limit: 1 }),
    enabled: !!token,
  });

  return {
    totalSigned: signedCountQuery.data?.total ?? 0,
    pendingReview: pendingReviewQuery.data?.total ?? 0,
    activeDrafts: draftsQuery.data?.total ?? 0,
    isLoading:
      signedCountQuery.isLoading || pendingReviewQuery.isLoading || draftsQuery.isLoading,
  };
}

export function useCreateContract(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateContractInput) => financeApi.createContract(token, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-kpis"] });
    },
  });
}

export function useFinanceDocument(token: string, contractId: string) {
  return useQuery({
    queryKey: ["finance-document", token, contractId],
    queryFn: () => financeApi.getSealedDocument(token, contractId),
    enabled: !!token && !!contractId,
    // Document links are short-lived. Do not reuse one when the preview is
    // reopened; the loaded iframe can keep using its URL for the current view.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useDownloadFinanceDocument(token: string) {
  return useMutation({
    // Always request a new presigned URL at click time.
    mutationFn: ({ id, contractNumber }: { id: string; contractNumber: string }) =>
      financeApi.downloadSealedDocument(token, id, contractNumber),
  });
}

export function useExportPayrollCsv(token: string) {
  return useMutation({
    mutationFn: () => financeApi.exportPayrollCsv(token),
  });
}

export function useExportPipelineCsv(token: string) {
  return useMutation({
    mutationFn: (params: ExportPipelineParams) => financeApi.exportPipelineCsv(token, params),
  });
}
