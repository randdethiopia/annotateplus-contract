import { toast } from "sonner";
import { UseMutationOptions, useMutation } from "@tanstack/react-query";
import {
  ContractSignPayload,
  ContractSignResult,
  FaydaUser,
  OtpSendResult,
  OtpVerifyPayload,
} from "@/types/fayda";

export type ApiError = { message: string };

// These hit this app's own Next.js route handlers (app/api/fayda/verify,
// app/api/contract/sign) via same-origin fetch — not the shared axios
// instance, since its baseURL is pointed at the external backend
// (see lib/axios.ts) and would otherwise bypass these local routes.
async function requestJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data as T;
}

export async function verifyFaydaIdFn(faydaId: string) {
  return requestJson<FaydaUser>("/api/fayda/verify", { faydaId });
}

export async function sendFaydaOtpFn(faydaId: string) {
  return requestJson<OtpSendResult>("/api/fayda/send-otp", { faydaId });
}

export async function verifyFaydaOtpFn(payload: OtpVerifyPayload) {
  return requestJson<FaydaUser>("/api/fayda/verify-otp", payload);
}

export async function signContractFn(payload: ContractSignPayload) {
  return requestJson<ContractSignResult>("/api/contract/sign", payload);
}

const Fayda = {
  verify: {
    useMutation: (
      options?: UseMutationOptions<FaydaUser, Error, string>
    ) =>
      useMutation({
        ...options,
        mutationFn: (faydaId) => verifyFaydaIdFn(faydaId),
        onError: (error, variables, onMutateResult, context) => {
          toast.error(error.message);
          options?.onError?.(error, variables, onMutateResult, context);
        },
      }),
  },
  sendOtp: {
    useMutation: (
      options?: UseMutationOptions<OtpSendResult, Error, string>
    ) =>
      useMutation({
        ...options,
        mutationFn: (faydaId) => sendFaydaOtpFn(faydaId),
        onError: (error, variables, onMutateResult, context) => {
          toast.error(error.message);
          options?.onError?.(error, variables, onMutateResult, context);
        },
      }),
  },
  verifyOtp: {
    useMutation: (
      options?: UseMutationOptions<FaydaUser, Error, OtpVerifyPayload>
    ) =>
      useMutation({
        ...options,
        mutationFn: (payload) => verifyFaydaOtpFn(payload),
        onError: (error, variables, onMutateResult, context) => {
          toast.error(error.message);
          options?.onError?.(error, variables, onMutateResult, context);
        },
      }),
  },
  sign: {
    useMutation: (
      options?: UseMutationOptions<ContractSignResult, Error, ContractSignPayload>
    ) =>
      useMutation({
        ...options,
        mutationFn: (payload) => signContractFn(payload),
        onError: (error, variables, onMutateResult, context) => {
          toast.error(error.message);
          options?.onError?.(error, variables, onMutateResult, context);
        },
      }),
  },
};

export default Fayda;
