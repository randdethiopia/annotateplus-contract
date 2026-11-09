"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, SearchX, Wallet } from "lucide-react";
import { EmptyState } from "@/components/system/empty-state";
import { MetricsStrip, type MetricSegment } from "@/components/system/metrics-strip";
import { PageHeader } from "@/components/system/page-header";
import { QueueShell } from "@/components/system/queue-shell";
import { RESULTS_REGION_ID } from "@/components/system/workstation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveBatchBanner } from "@/components/finance/payouts/active-batch-banner";
import {
  APPROVED_QUEUE_FILTERS,
  ApprovedCampaignsTable,
} from "@/components/finance/payouts/approved-campaigns-table";
import { CampaignDossierSheet } from "@/components/finance/payouts/campaign-dossier-sheet";
import { DeskSwitcher } from "@/components/finance/payouts/desk-switcher";
import { DisburseConfirmDialog } from "@/components/finance/payouts/disburse-confirm-dialog";
import { PayoutToolbar } from "@/components/finance/payouts/payout-toolbar";
import {
  PayoutsTable,
  PayoutsTableSkeleton,
} from "@/components/finance/payouts/payouts-table";
import { TreasuryBalanceBanner } from "@/components/finance/payouts/treasury-balance-banner";
import { RequirePermission } from "@/components/auth/require-permission";
import { useAuth } from "@/lib/auth/auth-context";
import { fromCents, toCents } from "@/lib/campaign-math";
import { useActiveBatch } from "@/lib/hooks/use-active-batch";
import { useCampaigns, useDisburseCampaign } from "@/lib/hooks/use-campaigns";
import { usePayoutBatch, useTreasuryBalance } from "@/lib/hooks/use-payouts";
import { describeError } from "@/lib/describe-error";
import { formatEtb } from "@/lib/money";
import type { CampaignListItemDto, PayoutItemDto } from "@/types/backend";

type DeskTab = "campaigns" | "batches";

function isDeskTab(value: string): value is DeskTab {
  return value === "campaigns" || value === "batches";
}

function matches(item: PayoutItemDto, needle: string): boolean {
  return (
    item.workerName.toLowerCase().includes(needle) ||
    item.contractNumber.toLowerCase().includes(needle) ||
    (item.bankName ?? "").toLowerCase().includes(needle) ||
    (item.maskedAccount ?? "").toLowerCase().includes(needle)
  );
}

function PayoutsWorkstation() {
  const { token } = useAuth();
  const authToken = token ?? "";
  const { batchId, setBatchId, clearBatch } = useActiveBatch();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<DeskTab>(() => (batchId ? "batches" : "campaigns"));

  // Ids and open flags are separate so content stays mounted through the close animation.
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [confirmCampaign, setConfirmCampaign] = useState<CampaignListItemDto | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: treasury } = useTreasuryBalance(authToken);
  const { data: approved } = useCampaigns(authToken, APPROVED_QUEUE_FILTERS);
  const disburse = useDisburseCampaign(authToken);
  const { data, isPending, isFetching, isError, error, refetch } = usePayoutBatch(
    authToken,
    batchId
  );

  const requiredAmount = useMemo(() => {
    if (!approved) return undefined;
    return fromCents(
      approved.data.reduce((total, campaign) => total + toCents(campaign.totalAmount), 0)
    );
  }, [approved]);

  const batch = data?.batch;
  const items = useMemo(() => data?.items ?? [], [data]);

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => matches(item, needle));
  }, [items, search]);

  const segments: MetricSegment[] = [
    {
      key: "staged",
      label: "Staged amount",
      value: batch ? formatEtb(batch.totalAmount) : "—",
      dotClassName: "bg-action",
    },
    {
      key: "workers",
      label: "Total workers",
      value: batch ? batch.totalItems.toLocaleString() : "—",
      dotClassName: "bg-slate-400",
    },
    {
      key: "settled",
      label: "Successful transfers",
      value: batch
        ? `${batch.successfulItems.toLocaleString()} / ${batch.totalItems.toLocaleString()}`
        : "—",
      dotClassName: "bg-emerald-600",
    },
  ];

  function discardBatch() {
    clearBatch();
    setSearch("");
  }

  function openDossier(campaignId: string) {
    setDossierId(campaignId);
    setDossierOpen(true);
  }

  function openConfirm(campaign: CampaignListItemDto) {
    setConfirmCampaign(campaign);
    setConfirmOpen(true);
  }

  function confirmDisburse() {
    if (!confirmCampaign) return;
    disburse.mutate(confirmCampaign._id, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        setDossierOpen(false);
        if (result.batchId) {
          setBatchId(result.batchId);
          setSearch("");
          setTab("batches");
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        category="Finance Operations"
        title="Workforce Payout & Treasury Desk"
        description="Release manager-approved campaign funds and track worker disbursements via Chapa."
      />

      <DeskSwitcher />

      <TreasuryBalanceBanner token={authToken} requiredAmount={requiredAmount} />

      <Tabs
        value={tab}
        onValueChange={(next) => isDeskTab(next) && setTab(next)}
        className="gap-5"
      >
        <TabsList>
          <TabsTrigger value="campaigns" className="px-3">
            Approved Campaigns
            {approved && approved.pagination.total > 0 && (
              <span className="bg-action-soft rounded-full px-1.5 text-[11px] font-semibold text-blue-700 tabular-nums">
                {approved.pagination.total}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="batches" className="px-3">
            Direct Batches &amp; CSV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <ApprovedCampaignsTable
            token={authToken}
            busyCampaignId={disburse.isPending ? (disburse.variables ?? null) : null}
            onReview={openDossier}
            onDisburse={openConfirm}
          />
        </TabsContent>

        <TabsContent value="batches" className="space-y-6">
          <MetricsStrip segments={segments} />

          {batch && (
            <ActiveBatchBanner token={authToken} batch={batch} onDiscard={discardBatch} />
          )}

          <PayoutToolbar
            token={authToken}
            search={search}
            onSearchChange={setSearch}
            onStaged={setBatchId}
            resultsRegionId={RESULTS_REGION_ID}
          />

          {batchId ? (
            <QueueShell
              id={RESULTS_REGION_ID}
              isPending={isPending}
              isFetching={isFetching}
              isError={isError}
              hasData={visibleItems.length > 0}
              isEmpty={visibleItems.length === 0}
              skeleton={<PayoutsTableSkeleton />}
              error={
                <div className="rounded-2xl bg-white px-6 py-14 text-center">
                  <AlertTriangle className="text-destructive mx-auto mb-3 size-5" aria-hidden />
                  <p className="text-foreground text-sm font-semibold">
                    Could not load this batch
                  </p>
                  <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm text-pretty">
                    {describeError(error, "The payout batch could not be read")}
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <Button type="button" variant="outline" onClick={() => refetch()}>
                      Try again
                    </Button>
                    <Button type="button" variant="ghost" onClick={discardBatch}>
                      Discard batch
                    </Button>
                  </div>
                </div>
              }
              empty={
                search.trim() ? (
                  <EmptyState
                    icon={<SearchX className="size-5" />}
                    title="No rows match that search"
                    description="Clear the search to see every payment staged in this batch."
                    action={
                      <Button type="button" variant="outline" onClick={() => setSearch("")}>
                        Clear search
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={<Wallet className="size-5" />}
                    title="This batch has no rows"
                    description="The uploaded file produced no payable items. Stage a different CSV to continue."
                  />
                )
              }
              notice={
                <div className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Live refresh failed — showing the last known state of this batch.
                </div>
              }
            >
              <PayoutsTable items={visibleItems} />
            </QueueShell>
          ) : (
            <EmptyState
              icon={<Wallet className="size-5" />}
              title="No batch staged"
              description="Upload a payroll CSV to stage a disbursement, or send a single transfer against one signed contract."
            />
          )}
        </TabsContent>
      </Tabs>

      <CampaignDossierSheet
        token={authToken}
        campaignId={dossierId}
        open={dossierOpen}
        onOpenChange={setDossierOpen}
        onDisburse={openConfirm}
      />

      <DisburseConfirmDialog
        token={authToken}
        campaign={confirmCampaign}
        treasuryBalance={treasury?.availableBalance}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={confirmDisburse}
        isDisbursing={disburse.isPending}
      />
    </div>
  );
}

export default function PayoutsPage() {
  return (
    <RequirePermission permission="payouts:disburse" homeHref="/finance" inset>
      <PayoutsWorkstation />
    </RequirePermission>
  );
}
