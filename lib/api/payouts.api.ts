import { api } from "@/lib/api/client";
import type {
  ExecuteBatchResponseData,
  PayoutBatchDetailsDto,
  PayoutBatchDto,
  SingleTransferRequestBody,
  SingleTransferResponseData,
  TreasuryBalanceDto,
} from "@/types/backend";

export const payoutsApi = {
  getTreasuryBalance(token: string): Promise<TreasuryBalanceDto> {
    return api<TreasuryBalanceDto>("/payouts/balances", { token });
  },

  getBatchDetails(token: string, batchId: string): Promise<PayoutBatchDetailsDto> {
    return api<PayoutBatchDetailsDto>(`/payouts/batches/${batchId}`, { token });
  },

  createBatchCsv(token: string, file: File, title: string): Promise<PayoutBatchDto> {
    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    return api<PayoutBatchDto>("/payouts/batches/upload-csv", {
      method: "POST",
      token,
      body: form,
    });
  },

  executeBatch(token: string, batchId: string): Promise<ExecuteBatchResponseData> {
    return api<ExecuteBatchResponseData>(`/payouts/batches/${batchId}/execute`, {
      method: "POST",
      token,
      body: {},
    });
  },

  singleTransfer(
    token: string,
    payload: SingleTransferRequestBody
  ): Promise<SingleTransferResponseData> {
    return api<SingleTransferResponseData>("/payouts/transfers/single", {
      method: "POST",
      token,
      body: payload,
    });
  },
};
