"use client";

import Link from "next/link";
import { AlertTriangle, Calendar, Plus, SearchX } from "lucide-react";
import { CampaignMetrics } from "@/components/hr/campaigns/campaign-metrics";
import { CampaignsTable, CampaignsTableSkeleton } from "@/components/hr/campaigns/campaigns-table";
import { CampaignsToolbar } from "@/components/hr/campaigns/campaigns-toolbar";
import { EmptyState } from "@/components/system/empty-state";
import { PageHeader } from "@/components/system/page-header";
import { QueueShell } from "@/components/system/queue-shell";
import { RESULTS_REGION_ID } from "@/components/system/workstation";
import { PaginationBar } from "@/components/contracts/pagination-bar";
import { Button } from "@/components/ui/button";
import {
  CapabilityTooltip,
  capabilityMessage,
} from "@/components/auth/capability-tooltip";
import { RequirePermission } from "@/components/auth/require-permission";
import { useAuth } from "@/lib/auth/auth-context";
import { useCampaignParams } from "@/lib/hooks/use-campaign-params";
import { useCampaignKpis, useCampaigns } from "@/lib/hooks/use-campaigns";
import { useHasPermission } from "@/lib/hooks/use-permission";
import { useClampPage } from "@/lib/hooks/use-clamp-page";
import { describeError } from "@/lib/describe-error";
import { formatAgreementDate } from "@/lib/format-date";

function TodayChip() {
  return (
    <span className="hidden min-w-40 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 sm:inline-flex">
      <Calendar className="size-3.5 text-slate-400" aria-hidden />
      <time suppressHydrationWarning>{formatAgreementDate(new Date().toISOString())}</time>
    </span>
  );
}

function CreateCampaignAction() {
  const canCreate = useHasPermission("campaigns:create");

  if (!canCreate) {
    return (
      <CapabilityTooltip message={capabilityMessage("campaigns:create")}>
        <Button type="button" disabled>
          <Plus className="size-4" aria-hidden />
          Create Campaign
        </Button>
      </CapabilityTooltip>
    );
  }

  return (
    <Button asChild>
      <Link href="/hr/campaigns/new">
        <Plus className="size-4" aria-hidden />
        Create Campaign
      </Link>
    </Button>
  );
}

function CampaignsWorkstation() {
  const { token } = useAuth();
  const authToken = token ?? "";

  const {
    status,
    search,
    projectCode,
    page,
    limit,
    hasFilters,
    setStatus,
    setSearch,
    setPage,
    setLimit,
    clearSearch,
    clearAll,
  } = useCampaignParams();

  const kpis = useCampaignKpis(authToken);
  const { data, isPending, isFetching, isPlaceholderData, isError, error } = useCampaigns(
    authToken,
    { status, search, projectCode, page, limit }
  );

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  const { isCorrecting } = useClampPage({
    page,
    totalPages: pagination?.totalPages,
    isSettled: !isFetching && !isPlaceholderData,
    onClamp: setPage,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        category="HR / Workforce"
        title="Campaigns Library"
        description="Manage data annotation runs, fluid compensation rules, and manager approvals."
        actions={
          <>
            <TodayChip />
            <CreateCampaignAction />
          </>
        }
      />

      <CampaignMetrics {...kpis} />

      <CampaignsToolbar
        token={authToken}
        search={search}
        onSearchChange={setSearch}
        onClearSearch={clearSearch}
        status={status}
        onStatusChange={setStatus}
        exportFilters={{ status, search, projectCode }}
        total={pagination?.total ?? 0}
        resultsRegionId={RESULTS_REGION_ID}
      />

      <QueueShell
        id={RESULTS_REGION_ID}
        isPending={isPending || isCorrecting}
        isFetching={isFetching}
        isError={isError}
        hasData={!!data}
        isEmpty={items.length === 0}
        skeleton={<CampaignsTableSkeleton />}
        error={
          <EmptyState
            icon={<AlertTriangle className="text-destructive size-5" />}
            title="Could not load campaigns"
            description={describeError(error, "The campaigns library could not be read")}
          />
        }
        empty={
          <EmptyState
            icon={<SearchX className="size-5" />}
            title={hasFilters ? "No campaigns match these filters." : "No campaigns yet."}
            description={
              hasFilters
                ? "Try a different status, or clear the search box."
                : "Campaigns you create will appear here."
            }
            action={
              hasFilters ? (
                <Button type="button" variant="outline" onClick={clearAll}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        }
        notice={
          <p className="bg-surface-subtle text-muted-foreground mb-3 rounded-lg px-3 py-2 text-xs">
            Couldn&apos;t refresh — showing the last result.
          </p>
        }
      >
        <CampaignsTable items={items} />
      </QueueShell>

      {!isError && pagination && (
        <PaginationBar
          page={page}
          limit={limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onLimitChange={setLimit}
          isFetching={isFetching}
          noun="campaign"
          nounPlural="campaigns"
        />
      )}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <RequirePermission
      anyPermission={["campaigns:create", "payouts:disburse"]}
      homeHref="/hr"
      inset
    >
      <CampaignsWorkstation />
    </RequirePermission>
  );
}
