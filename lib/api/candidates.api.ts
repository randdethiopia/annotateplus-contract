import { api } from "./client";
import type {
  CandidateListResponse,
  CandidateStatus,
  CandidateStatusUpdateResponseData,
  PublicCandidateApplyDto,
  PublicCandidateApplyResponseData,
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

export const candidatesApi = {
  apply: (dto: PublicCandidateApplyDto) =>
    api<PublicCandidateApplyResponseData>("/public/candidates/apply", {
      method: "POST",
      body: dto,
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
};
