"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  candidatesApi,
  type CandidateExportParams,
  type CandidateListParams,
} from "@/lib/api/candidates.api";
import { describeError } from "@/lib/describe-error";
import type {
  CandidateStatus,
  PublicIntakeStatusDto,
  ReviewerIntakeStatusDto,
} from "@/types/backend";

export const PUBLIC_INTAKE_STATUS_KEY = ["candidates-intake", "public"] as const;

export function reviewerIntakeStatusKey(token: string | null) {
  return ["candidates-intake", "reviewer", token] as const;
}

/** `/apply` gate — always revalidated on mount so a stale tab never shows an open form. */
export function usePublicIntakeStatus() {
  return useQuery({
    queryKey: PUBLIC_INTAKE_STATUS_KEY,
    queryFn: candidatesApi.getPublicIntakeStatus,
    staleTime: 0,
    retry: 1,
  });
}

export function useReviewerIntakeStatus(token: string | null) {
  return useQuery({
    queryKey: reviewerIntakeStatusKey(token),
    queryFn: () => candidatesApi.getReviewerIntakeStatus(token!),
    enabled: Boolean(token),
    staleTime: 30_000,
  });
}

export function useSetReviewerIntakeStatus(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isOpen: boolean) => candidatesApi.setReviewerIntakeStatus(token, isOpen),
    retry: 0,
    onSuccess: (data) => {
      queryClient.setQueryData<ReviewerIntakeStatusDto>(reviewerIntakeStatusKey(token), data);
      queryClient.setQueryData<PublicIntakeStatusDto>(PUBLIC_INTAKE_STATUS_KEY, {
        isOpen: data.isOpen,
        updatedAt: data.updatedAt,
      });
      queryClient.invalidateQueries({ queryKey: ["candidates-intake"] });
      toast.success(
        data.isOpen
          ? "Public intake activated — /apply is accepting applications"
          : "Public intake closed — /apply now shows the closed notice"
      );
    },
    onError: (err) => {
      console.error("Intake status update failed", err);
      toast.error(describeError(err, "Could not update public intake status"));
    },
  });
}

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

export function useExportCandidatesCsv(token: string) {
  return useMutation({
    mutationFn: (params: CandidateExportParams) => candidatesApi.exportCsv(token, params),
  });
}

export function useExportSignedCandidatesCsv(token: string) {
  return useMutation({
    mutationFn: () => candidatesApi.exportSignedCsv(token),
  });
}
