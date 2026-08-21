"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBlob } from "@/lib/backend/client";
import { saveBlob } from "@/lib/save-blob";
import type {
  ContractStatus,
  CreateContractResponseData,
  FinanceContractListItemDto,
  Paginated,
} from "@/types/backend";

export interface CreateContractInput {
  phone: string;
  contractPdf: File;
  contractNumber?: string;
  ratePerTaskEtb?: number;
  expiresInHours?: number;
}

const ALL_CONTRACT_STATUSES: ContractStatus[] = [
  "DRAFT",
  "INVITED",
  "VIEWED",
  "PENDING_REVIEW",
  "APPROVED",
  "PDF_GENERATION_FAILED",
  "SIGNED",
  "RESUBMISSION_REQUIRED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
];

async function fetchFinanceContractsByStatus(
  token: string,
  status: ContractStatus
): Promise<FinanceContractListItemDto[]> {
  try {
    const query = new URLSearchParams({ status, page: "1", limit: "100" });
    const result = await api<Paginated<FinanceContractListItemDto>>(
      `/finance/contracts?${query}`,
      { token }
    );
    return result.items;
  } catch {
    return [];
  }
}

export function useFinanceContracts(
  token: string,
  params: { status: ContractStatus | "ALL"; page: number; limit: number }
) {
  return useQuery({
    queryKey: ["finance-contracts", params.status, params.page, params.limit],
    queryFn: async (): Promise<Paginated<FinanceContractListItemDto>> => {
      if (params.status === "ALL") {
        // The API only supports one status per call (and defaults to SIGNED
        // when omitted) — "All" fans out across every status and merges here.
        const results = await Promise.all(
          ALL_CONTRACT_STATUSES.map((status) => fetchFinanceContractsByStatus(token, status))
        );
        const allItems = results
          .flat()
          .sort((a, b) => b.agreementDate.localeCompare(a.agreementDate));
        const start = (params.page - 1) * params.limit;
        return {
          items: allItems.slice(start, start + params.limit),
          page: params.page,
          limit: params.limit,
          total: allItems.length,
          totalPages: Math.max(Math.ceil(allItems.length / params.limit), 1),
        };
      }

      const query = new URLSearchParams({
        status: params.status,
        page: String(params.page),
        limit: String(params.limit),
      });
      return api<Paginated<FinanceContractListItemDto>>(`/finance/contracts?${query}`, { token });
    },
    enabled: !!token,
  });
}

export function useCreateContract(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateContractInput) => {
      const fd = new FormData();
      fd.append("phone", input.phone);
      fd.append("contractPdf", input.contractPdf);
      if (input.contractNumber) fd.append("contractNumber", input.contractNumber);
      if (input.ratePerTaskEtb != null) fd.append("ratePerTaskEtb", String(input.ratePerTaskEtb));
      if (input.expiresInHours != null)
        fd.append("expiresInHours", String(input.expiresInHours));
      return api<CreateContractResponseData>("/finance/contracts", {
        method: "POST",
        token,
        body: fd,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-contracts"] });
    },
  });
}

export function useDownloadFinanceDocument(token: string) {
  return useMutation({
    mutationFn: async ({ id, contractNumber }: { id: string; contractNumber: string }) => {
      const blob = await apiBlob(`/finance/contracts/${id}/document`, token);
      saveBlob(blob, `${contractNumber.replace(/[^\w]+/g, "_")}.pdf`);
    },
  });
}

export function useExportPayroll(token: string) {
  return useMutation({
    mutationFn: async () => {
      const blob = await apiBlob("/finance/contracts/export-payroll", token);
      const today = new Date().toISOString().slice(0, 10);
      saveBlob(blob, `payroll_export_${today}.csv`);
    },
  });
}
