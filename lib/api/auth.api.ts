import { api } from "@/lib/api/client";
import type {
  ActivateAccountPayload,
  ActivateAccountResponseData,
  ActivationPreviewDto,
  ChangePasswordPayload,
  ChangePasswordResponseData,
} from "@/types/backend";

export function getActivationPreview(token: string): Promise<ActivationPreviewDto> {
  return api<ActivationPreviewDto>(`/auth/activate/${encodeURIComponent(token)}`);
}

export function activateStaffAccount(
  payload: ActivateAccountPayload
): Promise<ActivateAccountResponseData> {
  return api<ActivateAccountResponseData>("/auth/activate", {
    method: "POST",
    body: payload,
  });
}

export function changeStaffPassword(
  token: string,
  payload: ChangePasswordPayload
): Promise<ChangePasswordResponseData> {
  return api<ChangePasswordResponseData>("/auth/change-password", {
    method: "POST",
    token,
    body: payload,
  });
}
