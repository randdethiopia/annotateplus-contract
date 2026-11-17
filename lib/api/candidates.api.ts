import { api, apiBlob } from "./client";
import { saveBlob } from "@/lib/save-blob";
import type {
  CandidateListResponse,
  CandidateStatus,
  CandidateStatusUpdateResponseData,
  PublicCandidateApplyDto,
  PublicCandidateApplyResponseData,
  PublicIntakeStatusDto,
  ReviewerIntakeStatusDto,
} from "@/types/backend";

export interface CandidateListParams {
  status?: string | string[];
  search?: string;
  region?: string;
  vulnerabilityStatus?: string;
  ageMin?: number;
  ageMax?: number;
  page?: number;
  limit?: number;
}

function buildCandidatesQuery(params: CandidateListParams = {}): string {
  const query = new URLSearchParams();
  const status = Array.isArray(params.status) ? params.status.join(",") : params.status;
  if (status) query.set("status", status);
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.region) query.set("region", params.region);
  if (params.vulnerabilityStatus) query.set("vulnerabilityStatus", params.vulnerabilityStatus);
  if (params.ageMin !== undefined) query.set("ageMin", String(params.ageMin));
  if (params.ageMax !== undefined) query.set("ageMax", String(params.ageMax));
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  return query.toString();
}

export type CandidateExportParams = Pick<
  CandidateListParams,
  "status" | "search" | "region" | "vulnerabilityStatus"
>;

/** Inclusive `YYYY-MM-DD` bounds on the contract signing date. */
export interface SignedExportParams {
  signedFrom?: string;
  signedTo?: string;
}

export const candidatesApi = {
  apply: (dto: PublicCandidateApplyDto) =>
    api<PublicCandidateApplyResponseData>("/public/candidates/apply", {
      method: "POST",
      body: dto,
    }),

  getPublicIntakeStatus: () => api<PublicIntakeStatusDto>("/public/candidates/status"),

  getReviewerIntakeStatus: (token: string) =>
    api<ReviewerIntakeStatusDto>("/reviewer/candidates/intake-status", { token }),

  setReviewerIntakeStatus: (token: string, isOpen: boolean) =>
    api<ReviewerIntakeStatusDto>("/reviewer/candidates/intake-status", {
      method: "POST",
      token,
      body: { isOpen },
    }),

  list: (token: string, params?: CandidateListParams) => {
    const query = buildCandidatesQuery(params);
    return api<CandidateListResponse>(
      query ? `/reviewer/candidates?${query}` : "/reviewer/candidates",
      { token }
    );
  },

  updateStatus: (token: string, id: string, status: CandidateStatus, notes?: string) =>
    api<CandidateStatusUpdateResponseData>(`/reviewer/candidates/${id}/status`, {
      method: "POST",
      token,
      body: { status, notes },
    }),

  async exportCsv(token: string, params: CandidateExportParams = {}): Promise<void> {
    const query = buildCandidatesQuery(params);
    const blob = await apiBlob(
      query ? `/reviewer/candidates/export?${query}` : "/reviewer/candidates/export",
      token
    );
    const today = new Date().toISOString().slice(0, 10);
    saveBlob(blob, `candidates_export_${today}.csv`);
  },

  async exportSignedCsv(token: string, params: SignedExportParams = {}): Promise<void> {
    const query = new URLSearchParams();
    if (params.signedFrom) query.set("signedFrom", params.signedFrom);
    if (params.signedTo) query.set("signedTo", params.signedTo);
    const qs = query.toString();
    const blob = await apiBlob(
      qs ? `/reviewer/candidates/export-signed?${qs}` : "/reviewer/candidates/export-signed",
      token
    );
    const today = new Date().toISOString().slice(0, 10);
    saveBlob(blob, `signed_workers_export_${today}.csv`);
  },
};
