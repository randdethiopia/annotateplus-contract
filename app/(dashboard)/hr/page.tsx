"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { CommandBar, type QueueFilterValue, type QueueTab } from "@/components/system/command-bar";
import { MetricsStrip } from "@/components/system/metrics-strip";
import { HrDataTable } from "@/components/hr/hr-data-table";
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
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const HR_TABS = (needsReview?: number): QueueTab[] => [
  { value: "ALL", label: "All" },
  { value: "PENDING_REVIEW", label: "Needs Review", count: needsReview },
  { value: "RESUBMISSION_REQUIRED", label: "Resubmissions" },
  { value: "SIGNED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

export default function HrPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<QueueFilterValue>("PENDING_REVIEW");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const kpis = useReviewerKpis(token ?? "");
  const { refresh, isRefreshing } = useRefreshReviewerQueue();
  const { data, isLoading, isError, error } = useReviewerContracts(token ?? "", {
    status: status === "ALL" ? undefined : status,
    search: search || undefined,
    page,
    limit,
  });

  const items = data?.items ?? [];
  const hasFilters = !!search || status !== "ALL";

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
            items={items}
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
          onSearchCommit={() => setPage(1)}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          tabs={HR_TABS(kpis.isLoading ? undefined : kpis.pendingReview)}
          searchLabel="Search the verification queue"
        />

        {isError ? (
          <EmptyState
            icon={<AlertTriangle className="text-destructive size-5" />}
            title="Could not load the review queue"
            description={
              error instanceof ApiError ? error.message : "Please check your connection and retry."
            }
            action={
              <Button type="button" variant="outline" onClick={refresh}>
                <RefreshCw className="size-4" />
                Try again
              </Button>
            }
          />
        ) : (
          <>
            <HrDataTable
              items={items}
              isLoading={isLoading}
              emptyTitle={
                hasFilters
                  ? "No candidate contracts match your filter."
                  : "No candidate contracts yet."
              }
            />

            {data && data.totalPages > 1 && (
              <PaginationBar
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
