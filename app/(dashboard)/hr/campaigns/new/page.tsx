"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/system/page-header";
import { RequirePermission } from "@/components/auth/require-permission";
import { ApproverSection, type ApproverDraft } from "@/components/hr/campaigns/builder/approver-section";
import { BuilderBreadcrumb } from "@/components/hr/campaigns/builder/builder-breadcrumb";
import {
  CampaignSettingsSection,
  type CampaignSettingsDraft,
} from "@/components/hr/campaigns/builder/campaign-settings-section";
import { ReviewSummary } from "@/components/hr/campaigns/builder/review-summary";
import {
  WorkerMatrix,
  type RowChangeHandler,
} from "@/components/hr/campaigns/builder/worker-matrix";
import { WizardFooter } from "@/components/hr/campaigns/builder/wizard-footer";
import { WizardSteps, type WizardStep } from "@/components/hr/campaigns/builder/wizard-steps";
import { useAuth } from "@/lib/auth/auth-context";
import {
  EMPTY_ROW,
  buildCompensationPayload,
  campaignRatePerTask,
  fromCents,
  isRowAdjusted,
  isTierComplete,
  netPayableCents,
  parseAmount,
  toTaskTierPayload,
  type CompensationTerms,
  type WorkerRowDraft,
} from "@/lib/campaign-math";
import { useApprovers, useSubmitCampaign } from "@/lib/hooks/use-campaigns";
import { useAllSignedContracts } from "@/lib/hooks/use-reviewer";

const INITIAL_SETTINGS: CampaignSettingsDraft = {
  title: "",
  projectCode: "",
  description: "",
  model: "PER_TASK",
  defaultRate: "100.00",
  defaultFixedAmount: "",
  taskTiers: [],
};

function missingTerm(terms: CompensationTerms): string | null {
  switch (terms.model) {
    case "PER_TASK":
      return parseAmount(terms.defaultRate) > 0 ? null : "default rate per task";
    case "FIXED":
      return parseAmount(terms.defaultFixedAmount) > 0 ? null : "default fixed stipend";
    case "HYBRID_TIERED":
      return terms.taskTiers.length > 0 && terms.taskTiers.every(isTierComplete)
        ? null
        : "a name and rate for every compensation tier";
  }
}

function CampaignBuilder() {
  const router = useRouter();
  const { token } = useAuth();
  const authToken = token ?? "";

  const [step, setStep] = useState<WizardStep>(1);
  const [furthest, setFurthest] = useState<WizardStep>(1);
  const [settings, setSettings] = useState<CampaignSettingsDraft>(INITIAL_SETTINGS);
  const [approver, setApprover] = useState<ApproverDraft>({ approverId: "" });
  const [rows, setRows] = useState<Record<string, WorkerRowDraft>>({});

  const signed = useAllSignedContracts(authToken);
  const workers = useMemo(() => signed.data?.items ?? [], [signed.data]);
  const approverDirectory = useApprovers(authToken || null);
  const selectedApprover = approverDirectory.data?.find(
    (candidate) => candidate._id === approver.approverId
  );
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
      (sum, worker) => sum + netPayableCents(rows[worker.contractId], settings),
      0
    );
    return { enrolled: list, totalCents: cents };
  }, [rows, settings, workers]);

  const totalBudget = fromCents(totalCents);

  const detailsMissing = [
    !settings.title.trim() && "campaign title",
    !settings.projectCode.trim() && "project code",
    missingTerm(settings),
    !approver.approverId && "designated approver",
  ].filter((item): item is string => typeof item === "string");

  const missing =
    enrolled.length === 0 ? [...detailsMissing, "at least one annotator"] : detailsMissing;

  const canAdvance =
    step === 1 ? detailsMissing.length === 0 : step === 2 ? enrolled.length > 0 : missing.length === 0;

  const blockedReason = canAdvance
    ? undefined
    : step === 2
      ? "Enrol at least one annotator to continue."
      : `To continue, add: ${(step === 1 ? detailsMissing : missing).join(", ")}.`;

  function goToStep(next: WizardStep) {
    setStep(next);
    setFurthest((prev) => (next > prev ? next : prev));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext() {
    if (!canAdvance) return;
    if (step === 1) goToStep(2);
    else if (step === 2) goToStep(3);
  }

  function handleBack() {
    if (step === 3) goToStep(2);
    else if (step === 2) goToStep(1);
  }

  function handleSubmit() {
    if (missing.length > 0) return;

    const defaultRatePerTaskEtb = campaignRatePerTask(settings);

    pipeline.submit(
      {
        campaign: {
          title: settings.title.trim(),
          projectCode: settings.projectCode.trim(),
          description: settings.description.trim() || undefined,
          compensationDefaults: {
            model: settings.model,
            defaultRatePerTaskEtb,
            taskTiers: toTaskTierPayload(settings),
          },
        },
        contractIds: enrolled.map((worker) => worker.contractId),
        compensation: enrolled.map((worker) => {
          const payload = buildCompensationPayload(rows[worker.contractId], settings);
          return {
            contractId: worker.contractId,
            adjusted: isRowAdjusted(payload, defaultRatePerTaskEtb),
            payload,
          };
        }),
        approval: { approverId: approver.approverId },
      },
      { onSuccess: () => router.push("/hr/campaigns") }
    );
  }

  return (
    <div className="pb-28">
      <div className="space-y-6">
        <BuilderBreadcrumb />
        <PageHeader
          tone="plain"
          category="HR / Workforce"
          title="New Workforce Campaign"
          description="Configure project rules, select signed annotators, and submit for manager approval."
        />
      </div>

      <WizardSteps
        className="z-30 mt-8 sm:sticky sm:top-14"
        current={step}
        furthest={furthest}
        disabled={pipeline.isPending}
        onStepChange={goToStep}
      />

      <div className="min-w-0 pt-12">
        <fieldset disabled={pipeline.isPending} className="min-w-0">
          {step === 1 && (
            <>
              <CampaignSettingsSection
                value={settings}
                onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
                locked={!!pipeline.draftCampaignId}
              />
              <ApproverSection
                token={authToken}
                value={approver}
                onChange={(patch) => setApprover((prev) => ({ ...prev, ...patch }))}
              />
            </>
          )}

          {step === 2 && (
            <WorkerMatrix
              workers={workers}
              totalSigned={signed.data?.total ?? workers.length}
              isPending={signed.isPending}
              isFetching={signed.isFetching}
              isError={signed.isError}
              error={signed.error}
              onRetry={() => void signed.refetch()}
              rows={rows}
              terms={settings}
              lockedIds={pipeline.enrolledOnServer}
              enrolledCount={enrolled.length}
              totalBudget={totalBudget}
              onRowChange={onRowChange}
              onSetEnrolled={onSetEnrolled}
            />
          )}

          {step === 3 && (
            <ReviewSummary
              title={settings.title.trim()}
              projectCode={settings.projectCode.trim()}
              terms={settings}
              approver={selectedApprover}
              enrolledCount={enrolled.length}
              totalBudget={totalBudget}
            />
          )}
        </fieldset>
      </div>

      <WizardFooter
        step={step}
        enrolledCount={enrolled.length}
        totalBudget={totalBudget}
        canAdvance={canAdvance}
        blockedReason={blockedReason}
        isSubmitting={pipeline.isPending}
        stage={pipeline.stage}
        compensated={pipeline.compensated}
        hasDraft={!!pipeline.draftCampaignId}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <RequirePermission permission="campaigns:create" homeHref="/hr" inset>
      <CampaignBuilder />
    </RequirePermission>
  );
}
