"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { campaignsApi } from "@/lib/api/campaigns.api";
import { describeError } from "@/lib/describe-error";
import type { ApprovalViewDto } from "@/types/backend";

export const OTP_MAX_ATTEMPTS = 3;
export const OTP_MAX_SENDS = 5;
export const OTP_TTL_MINUTES = 25;

function approvalKey(token: string) {
  return ["campaign-approval", token] as const;
}

export function useApprovalView(token: string) {
  return useQuery({
    queryKey: approvalKey(token),
    queryFn: () => campaignsApi.getApprovalView(token),
    enabled: !!token,
    // A 401/404 here means the link is dead; retrying only delays telling the manager.
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

export type OtpFailure =
  | { kind: "incorrect"; attemptsRemaining: number | undefined }
  | { kind: "locked" }
  | { kind: "expired" }
  | { kind: "not-requested" }
  | { kind: "not-pending" }
  | { kind: "deactivated" }
  | { kind: "link-expired" }
  | { kind: "email-missing" }
  | { kind: "cooldown"; retryAfterSeconds: number | undefined }
  | { kind: "send-limit" }
  | { kind: "rate-limited"; retryAfterSeconds: number | undefined }
  | { kind: "delivery-failed" }
  | { kind: "other"; message: string };

function readCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : undefined;
}

function readReason(err: ApiError): string {
  const reason = err.details?.reason;
  return typeof reason === "string" ? reason.toUpperCase() : "";
}

function readRetryAfter(err: ApiError): number | undefined {
  const seconds = readCount(err.details?.retryAfterSeconds) ?? readCount(err.retryAfterSeconds);
  return seconds === undefined ? undefined : Math.ceil(seconds);
}

export function readOtpFailure(err: unknown): OtpFailure {
  if (!(err instanceof ApiError)) {
    return { kind: "other", message: describeError(err, "The request could not be completed") };
  }

  const reason = readReason(err);
  const attemptsRemaining =
    readCount(err.details?.otpAttemptsRemaining) ??
    readCount(err.details?.remainingAttempts) ??
    readCount(err.details?.attemptsRemaining);

  if (reason === "OTP_LOCKED" || err.details?.otpLocked === true) return { kind: "locked" };
  if (reason === "APPROVER_INACTIVE") return { kind: "deactivated" };
  if (reason === "APPROVAL_LINK_EXPIRED") return { kind: "link-expired" };
  if (reason === "APPROVER_EMAIL_MISSING") return { kind: "email-missing" };
  if (reason === "OTP_EXPIRED") return { kind: "expired" };
  if (reason === "OTP_NOT_REQUESTED") return { kind: "not-requested" };
  if (reason === "OTP_SEND_LIMIT_REACHED") return { kind: "send-limit" };
  if (reason === "OTP_RESEND_COOLDOWN") {
    return { kind: "cooldown", retryAfterSeconds: readRetryAfter(err) };
  }
  if (reason === "EMAIL_DELIVERY_FAILED" || err.status === 502) return { kind: "delivery-failed" };
  if (reason === "NOT_PENDING_APPROVAL" || err.code === "INVALID_STATE_TRANSITION") {
    return { kind: "not-pending" };
  }
  if (err.status === 429) return { kind: "rate-limited", retryAfterSeconds: readRetryAfter(err) };
  if (attemptsRemaining !== undefined) {
    return attemptsRemaining === 0 ? { kind: "locked" } : { kind: "incorrect", attemptsRemaining };
  }
  return { kind: "other", message: err.message };
}

function patchView(queryClient: QueryClient, token: string, patch: Partial<ApprovalViewDto>) {
  queryClient.setQueryData<ApprovalViewDto>(approvalKey(token), (prev) =>
    prev ? { ...prev, ...patch } : prev
  );
}

function failurePatch(failure: OtpFailure): Partial<ApprovalViewDto> | null {
  switch (failure.kind) {
    case "incorrect":
      return failure.attemptsRemaining === undefined
        ? null
        : { otpAttemptsRemaining: failure.attemptsRemaining };
    case "locked":
      return { otpLocked: true, otpAttemptsRemaining: 0 };
    case "expired":
      return { otpExpiresAt: new Date().toISOString() };
    case "not-requested":
      return { otpRequested: false };
    case "send-limit":
      return { otpSendsRemaining: 0 };
    case "cooldown":
      return failure.retryAfterSeconds === undefined
        ? null
        : {
            otpResendAvailableAt: new Date(
              Date.now() + failure.retryAfterSeconds * 1000
            ).toISOString(),
          };
    default:
      return null;
  }
}

function syncFailure(queryClient: QueryClient, token: string, err: unknown) {
  const failure = readOtpFailure(err);
  if (failure.kind === "not-pending") {
    void queryClient.invalidateQueries({ queryKey: approvalKey(token) });
    return;
  }
  const patch = failurePatch(failure);
  if (patch) patchView(queryClient, token, patch);
}

export function useRequestApprovalOtp(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: () => campaignsApi.requestApprovalOtp(token),
    onSuccess: (data) => {
      patchView(queryClient, token, {
        otpRequested: true,
        otpLocked: false,
        otpExpiresAt: data.otpExpiresAt,
        otpResendAvailableAt: data.otpResendAvailableAt,
        approverEmailMasked: data.approverEmailMasked,
        otpAttemptsRemaining: data.otpAttemptsRemaining ?? OTP_MAX_ATTEMPTS,
        ...(data.otpSendsRemaining === undefined
          ? {}
          : { otpSendsRemaining: data.otpSendsRemaining }),
      });
    },
    onError: (err) => syncFailure(queryClient, token, err),
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
    onError: (err) => syncFailure(queryClient, token, err),
  });
}
