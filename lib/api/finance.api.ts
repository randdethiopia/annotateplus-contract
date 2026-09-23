import { api, apiBlob } from "@/lib/api/client";
import { DEFAULT_TEMPLATE_ID } from "@/lib/contract-templates";
import { normalizePhoneToLocal } from "@/lib/phone";
import { saveBlob } from "@/lib/save-blob";
import type {
  BulkRemindParams,
  BulkRemindResult,
  ContractStatus,
  CreateContractRequestBody,
  FinanceSummary,
  CreateContractResponseData,
  FinanceDocumentResponseData,
  FinanceContractListItemDto,
  Paginated,
  RemindContractResponse,
} from "@/types/backend";
import type { CreateContractInput } from "@/lib/validations/contract.schema";

export interface FinanceContractsParams {
  status?: ContractStatus | "ALL";
  search?: string;
  reminderEligible?: boolean;
  page: number;
  limit: number;
}

export interface ExportPipelineParams {
  status?: ContractStatus | "ALL";
  reminderEligible?: boolean;
  search?: string;
}

function buildContractsQuery(params: FinanceContractsParams): string {
  const query = new URLSearchParams();
  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.reminderEligible) {
    query.set("reminderEligible", "true");
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

  getSummary(token: string): Promise<FinanceSummary> {
    return api<FinanceSummary>("/finance/contracts/summary", { token });
  },

  bulkRemind(token: string, params: BulkRemindParams): Promise<BulkRemindResult> {
    return api<BulkRemindResult>("/finance/contracts/bulk-remind", {
      method: "POST",
      token,
      body: params,
    });
  },

  getSealedDocumentPath(contractId: string): string {
    return `/finance/contracts/${contractId}/document`;
  },

  getSealedDocument(
    token: string,
    contractId: string
  ): Promise<FinanceDocumentResponseData> {
    return api<FinanceDocumentResponseData>(
      financeApi.getSealedDocumentPath(contractId),
      { token }
    );
  },

  async downloadSealedDocument(
    token: string,
    contractId: string,
    contractNumber: string
  ): Promise<void> {
    const data = await financeApi.getSealedDocument(token, contractId);
    const response = await fetch(data.documentUrl);
    if (!response.ok) {
      throw new Error(`Failed to download document (${response.status})`);
    }

    const blob = await response.blob();
    saveBlob(blob, `${contractNumber.replace(/[^\w]+/g, "_")}.pdf`);
  },

  async exportPayrollCsv(token: string): Promise<void> {
    const blob = await apiBlob("/finance/contracts/export-payroll", token);
    const today = new Date().toISOString().slice(0, 10);
    saveBlob(blob, `payroll_export_${today}.csv`);
  },

  async exportPipelineCsv(token: string, params: ExportPipelineParams = {}): Promise<void> {
    const query = new URLSearchParams();
    if (params.status && params.status !== "ALL") {
      query.set("status", params.status);
    }
    if (params.reminderEligible) {
      query.set("reminderEligible", "true");
    }
    if (params.search?.trim()) {
      query.set("search", params.search.trim());
    }

    const queryString = query.toString();
    const blob = await apiBlob(
      `/finance/contracts/export-pipeline${queryString ? `?${queryString}` : ""}`,
      token
    );
    const today = new Date().toISOString().slice(0, 10);
    saveBlob(blob, `contracts_pipeline_${today}.csv`);
  },
};
