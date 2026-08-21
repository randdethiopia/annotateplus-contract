"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/backend/client";
import type {
  ApproveResponseData,
  ContractDossierDto,
  ContractListItemDto,
  ContractStatus,
  Paginated,
  RejectPayload,
  RejectResponseData,
  RetrySealingResponseData,
} from "@/types/backend";

export function useReviewerContracts(
  token: string,
  params: { status?: ContractStatus; page: number; limit: number }
) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));

  return useQuery({
    queryKey: ["reviewer-contracts", params.status, params.page, params.limit],
    queryFn: () =>
      api<Paginated<ContractListItemDto>>(`/reviewer/contracts?${query}`, { token }),
    enabled: !!token,
  });
}

// Fetched only when a reviewer explicitly opens a dossier — the backend
// audits every call as DOSSIER_VIEWED. Never prefetch or poll this query.
export function useContractDossier(token: string, id: string) {
  return useQuery({
    queryKey: ["reviewer-dossier", id],
    queryFn: () => api<ContractDossierDto>(`/reviewer/contracts/${id}`, { token }),
    enabled: !!token && !!id,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useApproveContract(token: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<ApproveResponseData>(`/reviewer/contracts/${id}/approve`, {
        method: "POST",
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviewer-contracts"] });
    },
  });
}

export function useRejectContract(token: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RejectPayload) =>
      api<RejectResponseData>(`/reviewer/contracts/${id}/reject`, {
        method: "POST",
        token,
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviewer-contracts"] });
    },
  });
}

export function useRetrySealing(token: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<RetrySealingResponseData>(`/reviewer/contracts/${id}/retry-sealing`, {
        method: "POST",
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviewer-contracts"] });
    },
  });
}
