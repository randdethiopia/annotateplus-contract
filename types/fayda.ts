export interface FaydaUser {
  faydaId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  region?: string;
}

export interface FaydaVerifyPayload {
  faydaId: string;
}

export interface OtpSendResult {
  success: boolean;
  message: string;
  maskedPhone: string;
  // Only present when no real SMS gateway is configured yet (dev/demo mode) —
  // see lib/fayda.ts. Never sent once SMS_GATEWAY_API_KEY is set.
  devOtp?: string;
}

export interface OtpVerifyPayload {
  faydaId: string;
  otp: string;
}

export interface ContractSignPayload {
  faydaId: string;
  fullName: string;
  contractVersion: string;
}

export interface ContractSignResult {
  success: boolean;
  message: string;
  referenceId: string;
  contractNumber: string;
  signedAt: string;
}
