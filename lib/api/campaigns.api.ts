import { api } from "@/lib/api/client";
import type {
  AddCampaignWorkersRequestBody,
  ApprovalViewDto,
  VerifyManagerOtpResponseData,
  AddCampaignWorkersResponseData,
  CampaignListApiResponse,
  CampaignDetailsDto,
  CampaignListResponse,
  CampaignQueryFilters,
  CampaignSummaryDto,
  CampaignWorkerRecordDto,
  CreateCampaignRequestBody,
  CreateCampaignResponseData,
  DisburseCampaignResponseData,
  SubmitCampaignApprovalRequestBody,
  WorkerCompensationRequestBody,
} from "@/types/backend";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function buildCampaignsQuery(filters: CampaignQueryFilters = {}): string {
  const query = new URLSearchParams();

  if (filters.status && filters.status !== "ALL") query.set("status", filters.status);
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.projectCode?.trim()) query.set("projectCode", filters.projectCode.trim());

  query.set("page", String(filters.page ?? DEFAULT_PAGE));
  query.set("limit", String(filters.limit ?? DEFAULT_LIMIT));

  return query.toString();
}

export const campaignsApi = {
  getCampaigns(token: string, filters?: CampaignQueryFilters): Promise<CampaignListResponse> {
    return api<CampaignListApiResponse>(`/campaigns?${buildCampaignsQuery(filters)}`, { token }).then(
      ({ items, total, page, limit }) => ({
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        },
      })
    );
  },

  getCampaign(id: string, token: string): Promise<CampaignDetailsDto> {
    return api<CampaignDetailsDto>(`/campaigns/${id}`, { token });
  },

  getSummary(token: string): Promise<CampaignSummaryDto> {
    return api<CampaignSummaryDto>("/campaigns/summary", { token });
  },

  createCampaign(
    payload: CreateCampaignRequestBody,
    token: string
  ): Promise<CreateCampaignResponseData> {
    return api<CreateCampaignResponseData>("/campaigns", {
      method: "POST",
      token,
      body: payload,
    });
  },

  addWorkersToCampaign(
    campaignId: string,
    contractIds: string[],
    token: string
  ): Promise<AddCampaignWorkersResponseData | CampaignWorkerRecordDto[] | undefined> {
    const body: AddCampaignWorkersRequestBody = { contractIds };
    return api<AddCampaignWorkersResponseData | CampaignWorkerRecordDto[] | undefined>(
      `/campaigns/${campaignId}/workers`,
      {
        method: "POST",
        token,
        body,
      }
    );
  },

  updateWorkerCompensation(
    campaignId: string,
    workerId: string,
    payload: WorkerCompensationRequestBody,
    token: string
  ): Promise<unknown> {
    return api<unknown>(`/campaigns/${campaignId}/workers/${workerId}/compensation`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  submitCampaignApproval(
    campaignId: string,
    payload: SubmitCampaignApprovalRequestBody,
    token: string
  ): Promise<unknown> {
    return api<unknown>(`/campaigns/${campaignId}/submit-approval`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  disburseCampaign(campaignId: string, token: string): Promise<DisburseCampaignResponseData> {
    return api<DisburseCampaignResponseData>(`/campaigns/${campaignId}/disburse`, {
      method: "POST",
      token,
      body: {},
    });
  },

  // The capability token is the path segment; these calls carry no bearer token.
  getApprovalView(token: string): Promise<ApprovalViewDto> {
    return api<ApprovalViewDto>(`/campaign-approvals/${encodeURIComponent(token)}`);
  },

  verifyManagerOtp(token: string, otp: string): Promise<VerifyManagerOtpResponseData | undefined> {
    return api<VerifyManagerOtpResponseData | undefined>(
      `/campaign-approvals/${encodeURIComponent(token)}/verify-otp`,
      { method: "POST", body: { otp } }
    );
  },
};
