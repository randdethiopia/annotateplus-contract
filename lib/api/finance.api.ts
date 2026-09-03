import { api, apiBlob } from "@/lib/api/client";
import { DEFAULT_TEMPLATE_ID } from "@/lib/contract-templates";
import { normalizePhoneToLocal } from "@/lib/phone";
import { saveBlob } from "@/lib/save-blob";
import type {
  ContractStatus,
  CreateContractRequestBody,
  CreateContractResponseData,
  FinanceContractListItemDto,
  Paginated,
  RemindContractResponse,
} from "@/types/backend";
import type { CreateContractInput } from "@/lib/validations/contract.schema";

export interface FinanceContractsParams {
  status?: ContractStatus | "ALL";
  search?: string;
  page: number;
  limit: number;
}

function buildContractsQuery(params: FinanceContractsParams): string {
  const query = new URLSearchParams();
  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  return query.toString();
}

export const financeApi = {
  getContracts(token: string, params: FinanceContractsParams): Promise<Paginated<FinanceContractListItemDto>> {
    const query = buildContractsQuery(params);
    return api<Paginated<FinanceContractListItemDto>>(`/finance/contracts?${query}`, { token });
  },

  createContract(
    token: string,
    input: CreateContractInput
  ): Promise<CreateContractResponseData> {
    // Canonicalized here rather than at the field: +251911223344 and 0911223344
    // are the same worker, and the backend keys the SMS and dedupe off this.
    const body: CreateContractRequestBody = {
      phone: normalizePhoneToLocal(input.phone),
      templateId: input.templateId || DEFAULT_TEMPLATE_ID,
    };

    return api<CreateContractResponseData>("/finance/contracts", {
      method: "POST",
      token,
      body,
    });
  },

  remindContract(token: string, contractId: string): Promise<RemindContractResponse> {
    return api<RemindContractResponse>(`/finance/contracts/${contractId}/remind`, {
      method: "POST",
      token,
    });
  },

  async downloadSealedDocument(
    token: string,
    contractId: string,
    contractNumber: string
  ): Promise<void> {
    const blob = await apiBlob(`/finance/contracts/${contractId}/document`, token);
    saveBlob(blob, `${contractNumber.replace(/[^\w]+/g, "_")}.pdf`);
  },

  async exportPayrollCsv(token: string): Promise<void> {
    const blob = await apiBlob("/finance/contracts/export-payroll", token);
    const today = new Date().toISOString().slice(0, 10);
    saveBlob(blob, `payroll_export_${today}.csv`);
  },
};
