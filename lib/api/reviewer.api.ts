import { api } from "@/lib/api/client";
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

export interface ReviewerContractsParams {
  status?: ContractStatus;
  search?: string;
  page: number;
  limit: number;
}

function buildContractsQuery(params: ReviewerContractsParams): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search?.trim()) query.set("search", params.search.trim());
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  return query.toString();
}

export const reviewerApi = {
  getContracts(token: string, params: ReviewerContractsParams): Promise<Paginated<ContractListItemDto>> {
    const query = buildContractsQuery(params);
    return api<Paginated<ContractListItemDto>>(`/reviewer/contracts?${query}`, { token });
  },

  getContractDossier(token: string, contractId: string): Promise<ContractDossierDto> {
    return api<ContractDossierDto>(`/reviewer/contracts/${contractId}`, { token });
  },

  getIdCardUrl(contractId: string, side: "front" | "back"): string {
    return `/reviewer/contracts/${contractId}/id-card/${side}`;
  },

  approveContract(token: string, contractId: string): Promise<ApproveResponseData> {
    return api<ApproveResponseData>(`/reviewer/contracts/${contractId}/approve`, {
      method: "POST",
      token,
    });
  },

  rejectContract(
    token: string,
    contractId: string,
    payload: RejectPayload
  ): Promise<RejectResponseData> {
    return api<RejectResponseData>(`/reviewer/contracts/${contractId}/reject`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  retrySealing(token: string, contractId: string): Promise<RetrySealingResponseData> {
    return api<RetrySealingResponseData>(`/reviewer/contracts/${contractId}/retry-sealing`, {
      method: "POST",
      token,
    });
  },
};
