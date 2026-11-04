"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { payoutsApi } from "@/lib/api/payouts.api";
import { describeError } from "@/lib/describe-error";
import type { SingleTransferRequestBody } from "@/types/backend";

export function useTreasuryBalance(token: string) {
  return useQuery({
    queryKey: ["finance-treasury", token],
    queryFn: () => payoutsApi.getTreasuryBalance(token),
    enabled: !!token,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

export function usePayoutBatch(token: string, batchId: string | null) {
  return useQuery({
    queryKey: ["payout-batch", token, batchId],
    queryFn: () => payoutsApi.getBatchDetails(token, batchId as string),
    enabled: !!token && !!batchId,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      query.state.data?.batch.status === "PROCESSING" ? 2_500 : false,
    refetchIntervalInBackground: false,
  });
}

export function useCreateBatchCsv(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title: string }) =>
      payoutsApi.createBatchCsv(token, file, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-treasury"] });
    },
  });
}

export function useExecuteBatch(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: (batchId: string) => payoutsApi.executeBatch(token, batchId),
    onSuccess: () => {
      toast.success("Disbursement dispatched. Tracking batch progress.");
      queryClient.invalidateQueries({ queryKey: ["payout-batch"] });
      queryClient.invalidateQueries({ queryKey: ["finance-treasury"] });
    },
    onError: (err) => {
      console.error("Batch execution failed", err);
      toast.error(describeError(err, "Could not dispatch disbursement"));
    },
  });
}

export function useSingleTransfer(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: (payload: SingleTransferRequestBody) =>
      payoutsApi.singleTransfer(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-treasury"] });
      queryClient.invalidateQueries({ queryKey: ["payout-batch"] });
    },
  });
}
