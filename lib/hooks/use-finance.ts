"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeApi, type FinanceContractsParams } from "@/lib/api/finance.api";
import type { CreateContractInput } from "@/lib/validations/contract.schema";

export function useFinanceContracts(token: string, params: FinanceContractsParams) {
  const filters = {
    status: params.status,
    search: params.search?.trim() || undefined,
    page: params.page,
    limit: params.limit,
  };

  return useQuery({
    queryKey: ["finance-contracts", filters],
    queryFn: () => financeApi.getContracts(token, params),
    enabled: !!token,
  });
}

export function useFinanceKpis(token: string) {
  const signedCountQuery = useQuery({
    queryKey: ["finance-kpis", "signed-count"],
    queryFn: () =>
      financeApi.getContracts(token, { status: "SIGNED", page: 1, limit: 1 }),
    enabled: !!token,
  });

  const pendingReviewQuery = useQuery({
    queryKey: ["finance-kpis", "pending-review"],
    queryFn: () =>
      financeApi.getContracts(token, { status: "PENDING_REVIEW", page: 1, limit: 1 }),
    enabled: !!token,
  });

  const draftsQuery = useQuery({
    queryKey: ["finance-kpis", "drafts"],
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

export function useDownloadFinanceDocument(token: string) {
  return useMutation({
    mutationFn: ({ id, contractNumber }: { id: string; contractNumber: string }) =>
      financeApi.downloadSealedDocument(token, id, contractNumber),
  });
}

export function useExportPayrollCsv(token: string) {
  return useMutation({
    mutationFn: () => financeApi.exportPayrollCsv(token),
  });
}
