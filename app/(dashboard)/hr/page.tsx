"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { CommandBar, type QueueTab } from "@/components/system/command-bar";
import { MetricsStrip } from "@/components/system/metrics-strip";
import { QueueShell } from "@/components/system/queue-shell";
import { RESULTS_REGION_ID } from "@/components/system/workstation";
import { HrDataTable, HrDataTableSkeleton } from "@/components/hr/hr-data-table";
import { EmptyState } from "@/components/system/empty-state";
import { ExportReviewerCsvButton } from "@/components/contracts/export-reviewer-csv-button";
import { PaginationBar } from "@/components/contracts/pagination-bar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useRefreshReviewerQueue,
  useReviewerContracts,
  useReviewerKpis,
} from "@/lib/hooks/use-reviewer";
import { useWorkstationParams } from "@/lib/hooks/use-workstation-params";
import { useClampPage } from "@/lib/hooks/use-clamp-page";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const HR_TABS = (needsReview: number): QueueTab[] => [
  { value: "ALL", label: "All" },
  { value: "PENDING_REVIEW", label: "Needs Review", count: needsReview },
  { value: "RESUBMISSION_REQUIRED", label: "Resubmissions" },
  { value: "SIGNED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

export default function HrPage() {
  const { token } = useAuth();
  // The URL is the only store for queue state — no useState mirrors it.
  const { status, search, page, limit, setStatus, setSearch, setPage, setLimit, clearSearch } =
    useWorkstationParams({ defaultStatus: "PENDING_REVIEW" });

  const kpis = useReviewerKpis(token ?? "");
  const { refresh, isRefreshing } = useRefreshReviewerQueue();
  const { data, isPending, isFetching, isPlaceholderData, isError, error } = useReviewerContracts(
    token ?? "",
    { status, search: search || undefined, page, limit }
  );

  const items = data?.items ?? [];
  const hasFilters = !!search || status !== "ALL";

  const { isCorrecting } = useClampPage({
    page,
    totalPages: data?.totalPages,
    isSettled: !isFetching && !isPlaceholderData,
    onClamp: setPage,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Verification Queue
        </h1>
        {/* On a phone the two actions split one row evenly instead of wrapping
            into a ragged stack. */}
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <ExportReviewerCsvButton
            token={token ?? ""}
            status={status}
            search={search || undefined}
            total={data?.total ?? 0}
            fileName="hr-contracts.csv"
            className="flex-1 sm:flex-none"
          />
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <MetricsStrip
        isLoading={kpis.isLoading}
        segments={[
          {
            key: "pending",
            label: "Pending Review",
            value: kpis.pendingReview,
            dotClassName: "bg-amber-500",
          },
          {
            key: "resubmission",
            label: "Resubmission Req.",
            value: kpis.resubmissionRequired,
            dotClassName: "bg-orange-500",
          },
          {
            key: "verified",
            label: "Verified",
            value: kpis.totalVerified,
            dotClassName: "bg-emerald-500",
          },
          {
            key: "rejected",
            label: "Terminal Rejected",
            value: kpis.totalRejected,
            dotClassName: "bg-rose-500",
          },
        ]}
      />

      <div className="space-y-4">
        <CommandBar
          search={search}
          onSearchChange={setSearch}
          onClearSearch={clearSearch}
          status={status}
          onStatusChange={setStatus}
          tabs={HR_TABS(kpis.pendingReview)}
          searchLabel="Search the verification queue"
        />

        <QueueShell
          id={RESULTS_REGION_ID}
          isPending={isPending || isCorrecting}
          isFetching={isFetching}
          isError={isError}
          hasData={!!data}
          isEmpty={items.length === 0}
          skeleton={<HrDataTableSkeleton />}
          error={
            <EmptyState
              icon={<AlertTriangle className="text-destructive size-5" />}
              title="Could not load the review queue"
              description={
                error instanceof ApiError
                  ? error.message
                  : "Please check your connection and retry."
              }
              action={
                <Button type="button" variant="outline" onClick={refresh}>
                  <RefreshCw className="size-4" />
                  Try again
                </Button>
              }
            />
          }
          empty={
            <EmptyState
              title={
                hasFilters
                  ? "No candidate contracts match your filter."
                  : "No candidate contracts yet."
              }
              description={
                hasFilters ? "Try a different status filter, or clear the search box." : undefined
              }
              action={
                hasFilters ? (
                  <Button type="button" variant="outline" onClick={clearSearch}>
                    Clear search
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
          <HrDataTable items={items} />
        </QueueShell>

        {!isError && data && (
          <PaginationBar
            page={page}
            limit={limit}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={setPage}
            onLimitChange={setLimit}
            isFetching={isFetching}
          />
        )}
      </div>
    </div>
  );
}
