"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { candidatesApi, type CandidateListParams } from "@/lib/api/candidates.api";
import { describeError } from "@/lib/describe-error";
import type { CandidateStatus } from "@/types/backend";

export function useCandidates(token: string | null, filters?: CandidateListParams) {
  return useQuery({
    queryKey: ["candidates", token, filters],
    queryFn: () => candidatesApi.list(token!, filters),
    enabled: Boolean(token),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}

export interface UpdateCandidateStatusInput {
  id: string;
  status: CandidateStatus;
  notes?: string;
}

const STATUS_TOAST: Record<CandidateStatus, string> = {
  NEW: "Candidate returned to the new pool",
  SHORTLISTED: "Candidate shortlisted",
  CONTRACT_ISSUED: "Candidate marked as contracted",
  REJECTED: "Candidate rejected",
  ARCHIVED: "Candidate archived",
};

export function useUpdateCandidateStatus(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: UpdateCandidateStatusInput) =>
      candidatesApi.updateStatus(token, id, status, notes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast.success(STATUS_TOAST[variables.status]);
    },
    onError: (err) => {
      console.error("Candidate status update failed", err);
      toast.error(describeError(err, "Could not update candidate status"));
    },
  });
}
