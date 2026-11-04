"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/system/page-header";
import { ApproverSection, type ApproverDraft } from "@/components/hr/campaigns/builder/approver-section";
import { BuilderBreadcrumb } from "@/components/hr/campaigns/builder/builder-breadcrumb";
import { BuilderCommandBar } from "@/components/hr/campaigns/builder/builder-command-bar";
import {
  CampaignSettingsSection,
  type CampaignSettingsDraft,
} from "@/components/hr/campaigns/builder/campaign-settings-section";
import {
  WorkerMatrix,
  type RowChangeHandler,
} from "@/components/hr/campaigns/builder/worker-matrix";
import { useAuth } from "@/lib/auth/auth-context";
import {
  EMPTY_ROW,
  buildCompensationPayload,
  fromCents,
  isRowAdjusted,
  netPayableCents,
  parseAmount,
  toEthiopianE164,
  type WorkerRowDraft,
} from "@/lib/campaign-math";
import { useSubmitCampaign } from "@/lib/hooks/use-campaigns";
import { useReviewerContracts } from "@/lib/hooks/use-reviewer";

const SIGNED_WORKERS_LIMIT = 100;

const INITIAL_SETTINGS: CampaignSettingsDraft = {
  title: "",
  projectCode: "",
  description: "",
  model: "PER_TASK",
  defaultRate: "100.00",
};

export default function NewCampaignPage() {
  const router = useRouter();
  const { token } = useAuth();
  const authToken = token ?? "";

  const [settings, setSettings] = useState<CampaignSettingsDraft>(INITIAL_SETTINGS);
  const [approver, setApprover] = useState<ApproverDraft>({ name: "", phone: "" });
  const [rows, setRows] = useState<Record<string, WorkerRowDraft>>({});

  const signed = useReviewerContracts(authToken, {
    status: "SIGNED",
    page: 1,
    limit: SIGNED_WORKERS_LIMIT,
  });
  const workers = useMemo(() => signed.data?.items ?? [], [signed.data]);
  const pipeline = useSubmitCampaign(authToken);

  const onRowChange = useCallback<RowChangeHandler>((contractId, patch) => {
    setRows((prev) => ({ ...prev, [contractId]: { ...(prev[contractId] ?? EMPTY_ROW), ...patch } }));
  }, []);

  const onSetEnrolled = useCallback((contractIds: string[], enrolled: boolean) => {
    setRows((prev) => {
      const next = { ...prev };
      for (const id of contractIds) next[id] = { ...(prev[id] ?? EMPTY_ROW), enrolled };
      return next;
    });
  }, []);

  const { enrolled, totalCents } = useMemo(() => {
    const list = workers.filter((worker) => rows[worker.contractId]?.enrolled);
    const cents = list.reduce(
      (sum, worker) =>
        sum + netPayableCents(rows[worker.contractId], settings.model, settings.defaultRate),
      0
    );
    return { enrolled: list, totalCents: cents };
  }, [rows, settings.defaultRate, settings.model, workers]);

  const approverPhone = toEthiopianE164(approver.phone);

  const missing = [
    !settings.title.trim() && "campaign title",
    !settings.projectCode.trim() && "project code",
    parseAmount(settings.defaultRate) <= 0 &&
      (settings.model === "FIXED" ? "default fixed fee" : "default rate"),
    enrolled.length === 0 && "at least one annotator",
    !approver.name.trim() && "approver name",
    !approverPhone && "approver phone",
  ].filter((item): item is string => typeof item === "string");

  function handleSubmit() {
    if (missing.length > 0 || !approverPhone) return;

    pipeline.submit(
      {
        campaign: {
          title: settings.title.trim(),
          projectCode: settings.projectCode.trim(),
          description: settings.description.trim() || undefined,
          compensationDefaults: {
            model: settings.model,
            defaultRatePerTaskEtb: parseAmount(settings.defaultRate),
          },
        },
        contractIds: enrolled.map((worker) => worker.contractId),
        compensation: enrolled.map((worker) => {
          const row = rows[worker.contractId];
          return {
            contractId: worker.contractId,
            adjusted: isRowAdjusted(row),
            payload: buildCompensationPayload(row, settings.model, settings.defaultRate),
          };
        }),
        approval: { approverName: approver.name.trim(), approverPhone },
      },
      { onSuccess: () => router.push("/hr/campaigns") }
    );
  }

  return (
    // Bottom padding reserves the fixed command bar's height, so the last
    // section can always scroll clear of it.
    <div className="space-y-6 pb-40 sm:pb-28">
      <div className="space-y-4">
        <BuilderBreadcrumb />
        <PageHeader
          category="HR / Workforce"
          title="New Workforce Campaign"
          description="Configure project rules, select signed annotators, and submit for manager approval."
        />
      </div>

      <fieldset disabled={pipeline.isPending} className="min-w-0 space-y-6">
        <CampaignSettingsSection
          value={settings}
          onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          locked={!!pipeline.draftCampaignId}
        />

        <WorkerMatrix
          workers={workers}
          totalSigned={signed.data?.total ?? workers.length}
          isPending={signed.isPending}
          isFetching={signed.isFetching}
          isError={signed.isError}
          error={signed.error}
          onRetry={() => void signed.refetch()}
          rows={rows}
          model={settings.model}
          defaultRate={settings.defaultRate}
          lockedIds={pipeline.enrolledOnServer}
          enrolledCount={enrolled.length}
          onRowChange={onRowChange}
          onSetEnrolled={onSetEnrolled}
        />

        <ApproverSection
          value={approver}
          onChange={(patch) => setApprover((prev) => ({ ...prev, ...patch }))}
        />
      </fieldset>

      <BuilderCommandBar
        enrolledCount={enrolled.length}
        totalBudget={fromCents(totalCents)}
        missing={missing}
        isSubmitting={pipeline.isPending}
        stage={pipeline.stage}
        compensated={pipeline.compensated}
        hasDraft={!!pipeline.draftCampaignId}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
