"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBlob } from "@/lib/api/client";
import { uploadViaPresign } from "@/lib/api/upload";
import { saveBlob } from "@/lib/save-blob";
import type {
  WorkerContractViewDto,
  WorkerSubmitPayload,
  WorkerSubmitResponseData,
} from "@/types/backend";

export function useWorkerContract(token: string) {
  return useQuery({
    queryKey: ["worker-contract", token],
    queryFn: () => api<WorkerContractViewDto>("/worker/me", { token }),
    enabled: !!token,
    retry: false,
    // Poll politely only while the worker is waiting on a human decision.
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING_REVIEW" ? 15_000 : false,
  });
}

export function useSubmitWorkerContract(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: WorkerSubmitPayload) => {
      const [faydaFrontUrl, faydaBackUrl] = await Promise.all([
        uploadViaPresign(token, payload.faydaFront),
        uploadViaPresign(token, payload.faydaBack),
      ]);

      return api<WorkerSubmitResponseData>("/worker/me/submit", {
        method: "POST",
        token,
        body: {
          fullNameEnglish: payload.fullNameEnglish,
          fullNameAmharic: payload.fullNameAmharic,
          residenceLocation: payload.residenceLocation,
          bankName: payload.bankName,
          bankAccountHolderName: payload.bankAccountHolderName,
          bankAccountNumber: payload.bankAccountNumber,
          faydaFrontUrl,
          faydaBackUrl,
        },
      });
    },
    onSuccess: (data) => {
      // Flip the cached status immediately so the form closes and the
      // "under review" screen shows without waiting for the next poll.
      queryClient.setQueryData<WorkerContractViewDto>(["worker-contract", token], (old) =>
        old ? { ...old, status: data.status, currentAttemptNumber: data.attemptNumber } : old
      );
    },
  });
}

export function useDownloadSignedContract(token: string) {
  return useMutation({
    mutationFn: async (contractNumber: string) => {
      const blob = await apiBlob("/worker/me/download", token);
      saveBlob(blob, `Signed_Agreement_${contractNumber.replace(/[^\w]+/g, "_")}.pdf`);
    },
  });
}
