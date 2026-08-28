import { api, apiBlob } from "@/lib/api/client";
import { saveBlob } from "@/lib/save-blob";
import type {
  ContractStatus,
  CreateContractResponseData,
  FinanceContractListItemDto,
  Paginated,
} from "@/types/backend";
import type { CreateContractFormInput } from "@/lib/validations/contract.schema";

export interface FinanceContractsParams {
  status?: ContractStatus | "ALL";
  search?: string;
  page: number;
  limit: number;
}

function toPdfUpload(file: File): File {
  const name = file.name.toLowerCase().endsWith(".pdf") ? file.name : `${file.name}.pdf`;
  if (file.type === "application/pdf" && file.name === name) return file;
  return new File([file], name, { type: "application/pdf" });
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

  createContract(token: string, input: CreateContractFormInput): Promise<CreateContractResponseData> {
    const fd = new FormData();
    const contractPdf = toPdfUpload(input.contractPdf);
    fd.append("phone", input.phone.trim());
    fd.append("contractPdf", contractPdf, contractPdf.name);
    fd.append("contractNumber", input.contractNumber);
    return api<CreateContractResponseData>("/finance/contracts", {
      method: "POST",
      token,
      body: fd,
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
