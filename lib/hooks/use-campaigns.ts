"use client";

import { useCallback, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { campaignsApi } from "@/lib/api/campaigns.api";
import { ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/describe-error";
import type {
  AddCampaignWorkersResponseData,
  CampaignListItemDto,
  CampaignListResponse,
  CampaignQueryFilters,
  CampaignWorkerRecordDto,
  CreateCampaignRequestBody,
  SubmitCampaignApprovalRequestBody,
  WorkerCompensationRequestBody,
} from "@/types/backend";

const LIST_STALE_TIME = 15_000;

export function useCampaigns(token: string, filters: CampaignQueryFilters) {
  const normalized: CampaignQueryFilters = {
    status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
    search: filters.search?.trim() || undefined,
    projectCode: filters.projectCode?.trim() || undefined,
    page: filters.page,
    limit: filters.limit,
  };

  return useQuery({
    queryKey: ["campaigns", token, normalized],
    queryFn: () => campaignsApi.getCampaigns(token, normalized),
    enabled: !!token,
    placeholderData: keepPreviousData,
    staleTime: LIST_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useApprovers(token: string | null) {
  return useQuery({
    queryKey: ["campaign-approvers"],
    queryFn: () => campaignsApi.getApprovers(token as string),
    enabled: !!token,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useCampaign(token: string, campaignId: string | null) {
  return useQuery({
    queryKey: ["campaign", token, campaignId],
    queryFn: () => campaignsApi.getCampaign(campaignId as string, token),
    enabled: !!token && !!campaignId,
    staleTime: LIST_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

function isInsufficientBalance(err: ApiError): boolean {
  return err.details?.reason === "INSUFFICIENT_BALANCE";
}

export function useDisburseCampaign(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: (campaignId: string) => campaignsApi.disburseCampaign(campaignId, token),
    onSuccess: (result) => {
      for (const key of ["campaigns", "campaign", "campaign-summary", "finance-treasury", "payout-batch"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      if (result.alreadyDisbursed) {
        toast.info(`Campaign ${result.campaignNumber} was already disbursed`);
      } else {
        toast.success("Disbursement dispatched to Chapa successfully");
      }
    },
    onError: (err) => {
      console.error("Campaign disbursement failed", err);
      // A refused attempt releases the campaign back to APPROVED_BY_MANAGER.
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      if (err instanceof ApiError && err.status === 409) {
        if (isInsufficientBalance(err)) {
          toast.error("Insufficient Chapa treasury balance", {
            description:
              "Top up the Chapa account and retry. The staged batch is reused, so workers are never paid twice.",
          });
          queryClient.invalidateQueries({ queryKey: ["finance-treasury"] });
        } else {
          toast.error("A disbursement for this campaign is already in progress", {
            description: err.message,
          });
        }
        return;
      }
      toast.error(describeError(err, "Failed to disburse campaign"));
    },
  });
}

export interface CampaignKpis {
  totalCampaigns: number | null;
  totalDisbursed: number | null;
  enrolledWorkers: number | null;
  pendingApprovals: number | null;
  isLoading: boolean;
}

type CampaignProbeData = CampaignListResponse | CampaignListItemDto[];

function getProbeRows(data: CampaignProbeData | undefined): CampaignListItemDto[] {
  if (Array.isArray(data)) return data;
  return data?.data ?? [];
}

function getProbeTotal(data: CampaignProbeData | undefined): number | null {
  return Array.isArray(data) ? data.length : data?.pagination?.total ?? null;
}

export function useCampaignKpis(token: string): CampaignKpis {
  const summary = useQuery({
    queryKey: ["campaign-summary", token],
    queryFn: () => campaignsApi.getSummary(token),
    enabled: !!token,
    staleTime: LIST_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const useProbe = !!token && summary.isError;

  const totalProbe = useQuery({
    queryKey: ["campaign-kpis", "total", token],
    queryFn: () => campaignsApi.getCampaigns(token, { page: 1, limit: 1 }),
    enabled: useProbe,
    staleTime: LIST_STALE_TIME,
    refetchOnWindowFocus: false,
  });

  const pendingProbe = useQuery({
    queryKey: ["campaign-kpis", "pending", token],
    queryFn: () =>
      campaignsApi.getCampaigns(token, { status: "PENDING_APPROVAL", page: 1, limit: 1 }),
    enabled: useProbe,
    staleTime: LIST_STALE_TIME,
    refetchOnWindowFocus: false,
  });

  const totalProbeData = totalProbe.data as CampaignProbeData | undefined;
  const pendingProbeData = pendingProbe.data as CampaignProbeData | undefined;
  const loadedCampaigns = getProbeRows(totalProbeData);
  const hasLoadedCampaigns = totalProbe.data !== undefined;
  const fallbackDisbursed = hasLoadedCampaigns
    ? loadedCampaigns
        .filter((campaign) => campaign.status === "DISBURSED")
        .reduce((total, campaign) => total + campaign.totalAmount, 0)
    : null;
  const fallbackEnrolledWorkers = hasLoadedCampaigns
    ? loadedCampaigns.reduce((total, campaign) => total + campaign.totalWorkers, 0)
    : null;

  return {
    totalCampaigns: summary.data?.totalCampaigns ?? getProbeTotal(totalProbeData),
    totalDisbursed: summary.data?.totalDisbursedEtb ?? fallbackDisbursed,
    enrolledWorkers: summary.data?.enrolledWorkers ?? fallbackEnrolledWorkers,
    pendingApprovals: summary.data?.pendingApprovals ?? getProbeTotal(pendingProbeData),
    isLoading: summary.isPending || (useProbe && (totalProbe.isPending || pendingProbe.isPending)),
  };
}

// ── Campaign builder submission ───────────────────────────────────────────────

export interface CampaignSubmission {
  campaign: CreateCampaignRequestBody;
  contractIds: string[];
  /**
   * Every enrolled row. `adjusted: false` rows are only sent when an earlier
   * attempt already wrote different values for them, so a reset reaches the server.
   */
  compensation: {
    contractId: string;
    adjusted: boolean;
    payload: WorkerCompensationRequestBody;
  }[];
  approval: SubmitCampaignApprovalRequestBody;
}

export type CampaignSubmitStage = "create" | "enroll" | "compensate" | "approve";

const STAGE_LABEL: Record<CampaignSubmitStage, string> = {
  create: "create the campaign",
  enroll: "enroll the selected workers",
  compensate: "apply worker compensation",
  approve: "send the approval request",
};

/** What the server already holds, so a retry resumes instead of starting over. */
interface DraftProgress {
  campaignId: string | null;
  /** contractId → id the compensation endpoint expects. Presence means enrolled. */
  workerIds: Record<string, string>;
  /** contractId → serialized payload last accepted, so edits after a failure are re-sent. */
  compensated: Record<string, string>;
}

const EMPTY_PROGRESS: DraftProgress = { campaignId: null, workerIds: {}, compensated: {} };
const COMPENSATION_CONCURRENCY = 6;

class CampaignSubmitError extends Error {
  constructor(
    readonly stage: CampaignSubmitStage,
    readonly reason: unknown
  ) {
    super(`Could not ${STAGE_LABEL[stage]}`);
  }
}

async function atStage<T>(stage: CampaignSubmitStage, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    throw new CampaignSubmitError(stage, err);
  }
}

async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

function mapWorkerIds(
  response: AddCampaignWorkersResponseData | CampaignWorkerRecordDto[] | undefined,
  contractIds: string[]
): Record<string, string> {
  const records = Array.isArray(response)
    ? response
    : (response?.workers ?? response?.items ?? []);
  const map: Record<string, string> = {};
  for (const contractId of contractIds) {
    const record = records.find((r) => r.contractId === contractId);
    map[contractId] = record?.workerId ?? record?._id ?? contractId;
  }
  return map;
}

/**
 * Create → enroll → compensate → submit, as one resumable action.
 *
 * Each step records what the server accepted before the next one starts. A
 * failure part-way through leaves a DRAFT campaign behind, and the retry picks
 * up from that step rather than creating a second campaign. `retry: 0` because
 * a silently re-sent POST here is a duplicate campaign or a duplicate SMS.
 */
export function useSubmitCampaign(token: string) {
  const queryClient = useQueryClient();
  const progressRef = useRef<DraftProgress>(EMPTY_PROGRESS);
  const [progress, setProgress] = useState<DraftProgress>(EMPTY_PROGRESS);
  const [stage, setStage] = useState<CampaignSubmitStage | null>(null);
  const [compensated, setCompensated] = useState({ done: 0, total: 0 });

  const save = useCallback((next: DraftProgress) => {
    progressRef.current = next;
    setProgress(next);
  }, []);

  const invalidateCampaigns = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["campaign-summary"] });
    queryClient.invalidateQueries({ queryKey: ["campaign-kpis"] });
  }, [queryClient]);

  const mutation = useMutation({
    retry: 0,
    mutationFn: async (submission: CampaignSubmission) => {
      if (!progressRef.current.campaignId) {
        setStage("create");
        const created = await atStage("create", () =>
          campaignsApi.createCampaign(submission.campaign, token)
        );
        const campaignId = created?.campaignId ?? created?._id;
        if (!campaignId) {
          throw new CampaignSubmitError("create", new Error("No campaign id was returned"));
        }
        save({ ...progressRef.current, campaignId });
      }
      const campaignId = progressRef.current.campaignId as string;

      const toEnroll = submission.contractIds.filter(
        (id) => !(id in progressRef.current.workerIds)
      );
      if (toEnroll.length > 0) {
        setStage("enroll");
        const response = await atStage("enroll", () =>
          campaignsApi.addWorkersToCampaign(campaignId, toEnroll, token)
        );
        save({
          ...progressRef.current,
          workerIds: { ...progressRef.current.workerIds, ...mapWorkerIds(response, toEnroll) },
        });
      }

      const toCompensate = submission.compensation
        .map((entry) => ({ ...entry, signature: JSON.stringify(entry.payload) }))
        .filter(({ contractId, adjusted, signature }) => {
          const previous = progressRef.current.compensated[contractId];
          return (adjusted || previous !== undefined) && previous !== signature;
        });
      if (toCompensate.length > 0) {
        setStage("compensate");
        setCompensated({ done: 0, total: toCompensate.length });
        await atStage("compensate", () =>
          runPool(toCompensate, COMPENSATION_CONCURRENCY, async ({ contractId, payload, signature }) => {
            const workerId = progressRef.current.workerIds[contractId] ?? contractId;
            await campaignsApi.updateWorkerCompensation(campaignId, workerId, payload, token);
            save({
              ...progressRef.current,
              compensated: { ...progressRef.current.compensated, [contractId]: signature },
            });
            setCompensated((c) => ({ ...c, done: c.done + 1 }));
          })
        );
      }

      setStage("approve");
      await atStage("approve", () =>
        campaignsApi.submitCampaignApproval(campaignId, submission.approval, token)
      );
      return { campaignId };
    },
    onSuccess: () => {
      invalidateCampaigns();
      save(EMPTY_PROGRESS);
      toast.success("Campaign submitted! SMS OTP sent to manager.");
    },
    onError: (err) => {
      console.error("Campaign submission failed", err);
      const hasDraft = !!progressRef.current.campaignId;
      // The library should list the DRAFT that now exists, even though this run stopped.
      if (hasDraft) invalidateCampaigns();

      const title = err instanceof CampaignSubmitError ? err.message : "Submission failed";
      const reason = describeError(
        err instanceof CampaignSubmitError ? err.reason : err,
        "Request failed"
      );
      toast.error(title, {
        description: hasDraft
          ? `${reason}. The draft is saved; retrying continues from this step.`
          : reason,
      });
    },
    onSettled: () => setStage(null),
  });

  return {
    submit: mutation.mutate,
    isPending: mutation.isPending,
    stage,
    compensated,
    draftCampaignId: progress.campaignId,
    enrolledOnServer: progress.workerIds,
  };
}
