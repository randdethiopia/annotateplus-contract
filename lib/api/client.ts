import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiErrorBody, ApiSuccess } from "@/types/backend";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

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

const axiosClient = axios.create({
  baseURL,
});

axiosClient.interceptors.request.use((config) => {
  config.headers.set("X-Request-Id", crypto.randomUUID());
  return config;
});

function toApiError(error: AxiosError<ApiErrorBody>): ApiError {
  const status = error.response?.status ?? 0;
  const body = error.response?.data;
  const retryAfterHeader = error.response?.headers["retry-after"];
  return new ApiError(
    status,
    body?.error?.code ?? "UNKNOWN",
    body?.error?.message ?? error.message,
    body?.error?.details,
    body?.requestId,
    retryAfterHeader ? Number(retryAfterHeader) : undefined
  );
}

export interface ApiOptions {
  method?: string;
  token?: string;
  body?: BodyInit | object | null;
  headers?: Record<string, string>;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, body, method, headers: extraHeaders } = options;
  const isFormData = body instanceof FormData;

  const config: AxiosRequestConfig = {
    url: path,
    method: method ?? (body != null ? "POST" : "GET"),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders ?? {}),
      ...(isFormData || body == null ? {} : { "Content-Type": "application/json" }),
    },
    data: body,
  };

  try {
    const response = await axiosClient.request<ApiSuccess<T>>(config);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw toApiError(error as AxiosError<ApiErrorBody>);
    }
    throw error;
  }
}

export async function apiBlob(path: string, token?: string): Promise<Blob> {
  try {
    const response = await axiosClient.get(path, {
      responseType: "blob",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data as Blob;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<Blob | ApiErrorBody>;
      if (axiosError.response?.data instanceof Blob) {
        const raw = await axiosError.response.data.text();
        const body = JSON.parse(raw) as ApiErrorBody;
        const retryAfterHeader = axiosError.response.headers["retry-after"];
        throw new ApiError(
          axiosError.response.status,
          body?.error?.code ?? "UNKNOWN",
          body?.error?.message ?? axiosError.message,
          body?.error?.details,
          body?.requestId,
          retryAfterHeader ? Number(retryAfterHeader) : undefined
        );
      }
      throw toApiError(axiosError as AxiosError<ApiErrorBody>);
    }
    throw error;
  }
}
