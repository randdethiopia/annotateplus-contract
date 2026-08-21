import type { ApiErrorBody, ApiSuccess } from "@/types/backend";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;
  requestId?: string;
  retryAfterSeconds?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
    requestId?: string,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
  const retryAfterHeader = res.headers.get("Retry-After");
  return new ApiError(
    res.status,
    body?.error?.code ?? "UNKNOWN",
    body?.error?.message ?? res.statusText,
    body?.error?.details,
    body?.requestId,
    retryAfterHeader ? Number(retryAfterHeader) : undefined
  );
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  token?: string;
  body?: BodyInit | object | null;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, body, ...rest } = options;

  const isFormData = body instanceof FormData;
  const finalBody = isFormData ? body : body != null ? JSON.stringify(body) : undefined;

  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...rest,
    body: finalBody,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isFormData ? {} : body != null ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    throw await toApiError(res);
  }

  const parsed = (await res.json()) as ApiSuccess<T>;
  return parsed.data;
}

export async function apiBlob(path: string, token?: string): Promise<Blob> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw await toApiError(res);
  }

  return res.blob();
}
