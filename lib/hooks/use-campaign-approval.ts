"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { campaignsApi } from "@/lib/api/campaigns.api";
import { describeError } from "@/lib/describe-error";
import type { ApprovalViewDto } from "@/types/backend";

function approvalKey(token: string) {
  return ["campaign-approval", token] as const;
}

export function useApprovalView(token: string) {
  return useQuery({
    queryKey: approvalKey(token),
    queryFn: () => campaignsApi.getApprovalView(token),
    enabled: !!token,
    // A 401/404 here means the link is dead; retrying only delays telling the manager.
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useVerifyManagerOtp(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    // A re-sent verify is a second attempt against a three-attempt lockout.
    retry: 0,
    mutationFn: (otp: string) => campaignsApi.verifyManagerOtp(token, otp),
    onSuccess: (data) => {
      queryClient.setQueryData<ApprovalViewDto>(approvalKey(token), (prev) =>
        prev
          ? {
              ...prev,
              status: data?.status === "DISBURSED" ? "DISBURSED" : "APPROVED_BY_MANAGER",
              approvedAt: data?.approvedAt ?? new Date().toISOString(),
              otpLocked: false,
            }
          : prev
      );
    },
  });
}

export type OtpFailure =
  | { kind: "incorrect"; attemptsRemaining?: number }
  | { kind: "locked" }
  | { kind: "expired" }
  | { kind: "other"; message: string };

function readCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : undefined;
}

/**
 * The verify endpoint's error contract is not pinned down, so every signal it
 * might plausibly send is read. Order matters: "OTP_EXPIRED" and "OTP_LOCKED"
 * both contain "OTP", so the specific outcomes are tested first.
 */
export function readOtpFailure(err: unknown): OtpFailure {
  if (!(err instanceof ApiError)) {
    return { kind: "other", message: describeError(err, "Could not verify the code") };
  }

  const code = err.code.toUpperCase();
  const attemptsRemaining =
    readCount(err.details?.attemptsRemaining) ?? readCount(err.details?.remainingAttempts);

  if (err.status === 423 || err.status === 429 || code.includes("LOCKED") || attemptsRemaining === 0) {
    return { kind: "locked" };
  }
  if (err.status === 410 || code.includes("EXPIRED")) {
    return { kind: "expired" };
  }
  if (
    attemptsRemaining !== undefined ||
    err.status === 400 ||
    err.status === 422 ||
    code.includes("OTP") ||
    code.includes("CODE")
  ) {
    return { kind: "incorrect", attemptsRemaining };
  }
  return { kind: "other", message: err.message };
}
