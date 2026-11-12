"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/system/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  APPROVED_QUEUE_FILTERS,
  ApprovedCampaignsTable,
} from "@/components/finance/payouts/approved-campaigns-table";
import { CampaignDossierSheet } from "@/components/finance/payouts/campaign-dossier-sheet";
import { DeskSwitcher } from "@/components/finance/payouts/desk-switcher";
import { DisburseConfirmDialog } from "@/components/finance/payouts/disburse-confirm-dialog";
import { DisbursementHistoryTable } from "@/components/finance/payouts/disbursement-history-table";
import { TreasuryBalanceBanner } from "@/components/finance/payouts/treasury-balance-banner";
import { RequirePermission } from "@/components/auth/require-permission";
import { useAuth } from "@/lib/auth/auth-context";
import { fromCents, toCents } from "@/lib/campaign-math";
import { useCampaigns, useDisburseCampaign } from "@/lib/hooks/use-campaigns";
import { useTreasuryBalance } from "@/lib/hooks/use-payouts";
import type { CampaignListItemDto } from "@/types/backend";

type DeskTab = "campaigns" | "history";

function isDeskTab(value: string): value is DeskTab {
  return value === "campaigns" || value === "history";
}

function PayoutsWorkstation() {
  const { token } = useAuth();
  const authToken = token ?? "";
  const [tab, setTab] = useState<DeskTab>("campaigns");

  // Ids and open flags are separate so content stays mounted through the close animation.
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [confirmCampaign, setConfirmCampaign] = useState<CampaignListItemDto | null>(null);
  const [confirmWorkerIds, setConfirmWorkerIds] = useState<string[] | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: treasury } = useTreasuryBalance(authToken);
  const { data: approved } = useCampaigns(authToken, APPROVED_QUEUE_FILTERS);
  const disburse = useDisburseCampaign(authToken);

  const requiredAmount = useMemo(() => {
    if (!approved) return undefined;
    return fromCents(
      approved.data.reduce((total, campaign) => total + toCents(campaign.totalAmount), 0)
    );
  }, [approved]);

  function openDossier(campaignId: string) {
    setDossierId(campaignId);
    setDossierOpen(true);
  }

  function openConfirm(campaign: CampaignListItemDto, workerIds?: string[]) {
    setConfirmCampaign(campaign);
    setConfirmWorkerIds(workerIds);
    setConfirmOpen(true);
  }

  function closeConfirm(next: boolean) {
    setConfirmOpen(next);
    if (!next) setConfirmWorkerIds(undefined);
  }

  function confirmDisburse() {
    if (!confirmCampaign) return;
    disburse.mutate(
      { campaignId: confirmCampaign._id, workerIds: confirmWorkerIds },
      {
        onSuccess: (result) => {
          setConfirmOpen(false);
          setConfirmWorkerIds(undefined);
          if (result.status === "PARTIALLY_DISBURSED") return;
          setDossierOpen(false);
          setTab("history");
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        category="Finance Operations"
        title="Workforce Payout & Treasury Desk"
        description="Release manager-approved campaign funds and audit settled worker disbursements via Chapa."
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
          <TabsTrigger value="history" className="px-3">
            Disbursement History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <ApprovedCampaignsTable
            token={authToken}
            busyCampaignId={disburse.isPending ? (disburse.variables?.campaignId ?? null) : null}
            onReview={openDossier}
            onDisburse={openConfirm}
          />
        </TabsContent>

        <TabsContent value="history">
          <DisbursementHistoryTable token={authToken} onReviewDossier={openDossier} />
        </TabsContent>
      </Tabs>

      <CampaignDossierSheet
        token={authToken}
        campaignId={dossierId}
        open={dossierOpen}
        onOpenChange={setDossierOpen}
        onDisburse={openConfirm}
        isDisbursing={disburse.isPending && disburse.variables?.campaignId === dossierId}
      />

      <DisburseConfirmDialog
        token={authToken}
        campaign={confirmCampaign}
        workerIds={confirmWorkerIds}
        treasuryBalance={treasury?.availableBalance}
        open={confirmOpen}
        onOpenChange={closeConfirm}
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
