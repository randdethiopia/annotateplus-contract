import { api } from "./client";
import type {
  CandidateListResponse,
  PublicCandidateApplyDto,
  PublicCandidateApplyResponseData,
} from "@/types/backend";

export interface CandidateListParams {
  status?: string;
  search?: string;
  region?: string;
  limit?: number;
}

function buildCandidatesQuery(params: CandidateListParams = {}): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.region) query.set("region", params.region);
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
};
