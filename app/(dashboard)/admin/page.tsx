"use client";

import Link from "next/link";
import { AlertTriangle, ClipboardCheck, Inbox, Wallet } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/system/page-header";
import { EmptyState } from "@/components/system/empty-state";
import { QueueShell } from "@/components/system/queue-shell";
import { RESULTS_REGION_ID } from "@/components/system/workstation";
import {
  CommandBar,
  statusFilterLabel,
  type QueueTab,
} from "@/components/system/command-bar";
import { PaginationBar } from "@/components/contracts/pagination-bar";
import { StatusSummary } from "@/components/contracts/status-summary";
import { ExportReviewerCsvButton } from "@/components/contracts/export-reviewer-csv-button";
import { ContractTableSkeleton } from "@/components/contracts/contract-table-skeleton";
import { AdminContractsTable } from "@/components/admin/admin-contracts-table";
import { useAuth } from "@/lib/auth/auth-context";
import { useReviewerContracts, useReviewerStatusCounts } from "@/lib/hooks/use-reviewer";
import { useWorkstationParams } from "@/lib/hooks/use-workstation-params";
import { useClampPage } from "@/lib/hooks/use-clamp-page";
import { ApiError } from "@/lib/api/client";
import type { ContractStatus } from "@/types/backend";

const ADMIN_TABS: QueueTab[] = [
  { value: "ALL", label: "All" },
  // Two labels are shortened deliberately; the rest defer to STATUS_STYLE so
  // they cannot drift from the badges in the rows they select for.
  { value: "PENDING_REVIEW", label: "Needs Review" },
  { value: "INVITED", label: statusFilterLabel("INVITED") },
  { value: "RESUBMISSION_REQUIRED", label: "Resubmissions" },
  { value: "SIGNED", label: statusFilterLabel("SIGNED") },
  { value: "REJECTED", label: statusFilterLabel("REJECTED") },
  { value: "EXPIRED", label: statusFilterLabel("EXPIRED") },
];

const SUMMARY_STATUSES: ContractStatus[] = [
  "PENDING_REVIEW",
  "RESUBMISSION_REQUIRED",
  "SIGNED",
  "REJECTED",
];

const SHORTCUTS = [
  {
    href: "/hr",
    icon: ClipboardCheck,
    title: "Review queue",
    description: "Verify candidate IDs and bank details, then approve or reject.",
    tint: "bg-amber-50 text-amber-700",
  },
  {
    href: "/finance",
    icon: Wallet,
    title: "Finance console",
    description: "Issue contracts, track status, and export bank-ready payouts.",
    tint: "bg-action-soft text-action",
  },
];

export default function AdminPage() {
  const { user, token } = useAuth();
  const { status, search, page, limit, setStatus, setSearch, setPage, setLimit, clearSearch } =
    useWorkstationParams({ defaultStatus: "ALL" });

  const { data, isPending, isFetching, isPlaceholderData, isError, error, refetch } =
    useReviewerContracts(token ?? "", {
      status,
      search: search || undefined,
      page,
      limit,
    });

  // Totals for the whole filtered set, not the rows on screen.
  const { counts, isLoading: isCountsLoading } = useReviewerStatusCounts(
    token ?? "",
    SUMMARY_STATUSES,
    search || undefined
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
    <div className="space-y-8">
      <PageHeader
        category="Administration"
        title={user ? `Welcome, ${user.fullName}` : "Admin Cockpit"}
        description="Full visibility over every contract, plus access to the review queue and finance console."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {SHORTCUTS.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="focus-visible:ring-ring rounded-2xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl ${shortcut.tint}`}
                    aria-hidden
                  >
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="mt-3">{shortcut.title}</CardTitle>
                  <CardDescription>{shortcut.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-foreground text-lg font-bold tracking-tight">All contracts</h2>
            <p className="text-muted-foreground text-sm">
              Click any row to open the full agreement.
            </p>
          </div>
        </div>

        <CommandBar
          search={search}
          onSearchChange={setSearch}
          onClearSearch={clearSearch}
          status={status}
          onStatusChange={setStatus}
          tabs={ADMIN_TABS}
          searchLabel="Search all contracts"
          actions={
            <ExportReviewerCsvButton
              token={token ?? ""}
              status={status}
              search={search || undefined}
              total={data?.total ?? 0}
              fileName="all-contracts.csv"
            />
          }
        />

        {/* Rendered whenever counts exist, not gated on the list query — gating
            it would unmount the tiles on every transition, a flicker of its own. */}
        <StatusSummary
          counts={counts}
          statuses={SUMMARY_STATUSES}
          isLoading={isCountsLoading}
        />

        <QueueShell
          id={RESULTS_REGION_ID}
          isPending={isPending || isCorrecting}
          isFetching={isFetching}
          isError={isError}
          hasData={!!data}
          isEmpty={items.length === 0}
          skeleton={<ContractTableSkeleton variant="admin" />}
          error={
            <EmptyState
              icon={<AlertTriangle className="text-destructive size-5" />}
              title="Could not load contracts"
              description={
                error instanceof ApiError
                  ? error.message
                  : "Please check your connection and retry."
              }
              action={
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  Try again
                </Button>
              }
            />
          }
          empty={
            <EmptyState
              icon={<Inbox className="size-5" />}
              title={hasFilters ? "No contracts match these filters" : "No contracts yet"}
              description={
                hasFilters
                  ? "Try a different status filter, or clear the search box."
                  : "Contracts created in the finance console appear here."
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
          <AdminContractsTable items={items} />
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
