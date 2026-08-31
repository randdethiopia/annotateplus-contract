"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ClipboardCheck, Inbox, Wallet } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/system/page-header";
import { StatusBadge } from "@/components/system/status-badge";
import { EmptyState } from "@/components/system/empty-state";
import { Omnibar, type FilterValue } from "@/components/system/omnibar";
import { PaginationBar } from "@/components/contracts/pagination-bar";
import { StatusSummary } from "@/components/contracts/status-summary";
import { ExportReviewerCsvButton } from "@/components/contracts/export-reviewer-csv-button";
import { ContractTableSkeleton } from "@/components/contracts/contract-table-skeleton";
import { ContractMobileCard } from "@/components/contracts/contract-mobile-card";
import { useAuth } from "@/lib/auth/auth-context";
import { useReviewerContracts } from "@/lib/hooks/use-reviewer";
import { normalizePhoneToLocal } from "@/lib/phone";
import { formatAgreementDate } from "@/lib/format-date";
import { ApiError } from "@/lib/api/client";

const FILTER_PILLS: FilterValue[] = [
  "ALL",
  "PENDING_REVIEW",
  "INVITED",
  "RESUBMISSION_REQUIRED",
  "SIGNED",
  "REJECTED",
  "EXPIRED",
];

const HEAD_CLASS = "text-muted-foreground text-[11px] font-semibold tracking-wider uppercase";

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
  const [status, setStatus] = useState<FilterValue>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError, error } = useReviewerContracts(token ?? "", {
    status: status === "ALL" ? undefined : status,
    search: search || undefined,
    page,
    limit,
  });

  const items = data?.items ?? [];
  const hasFilters = !!search || status !== "ALL";

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

        <Omnibar
          search={search}
          onSearchChange={setSearch}
          onSearchCommit={() => setPage(1)}
          status={status}
          onStatusChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          pills={FILTER_PILLS}
          actions={<ExportReviewerCsvButton items={items} fileName="all-contracts.csv" />}
        />

        {!isLoading && !isError && data && (
          <StatusSummary
            items={data.items}
            statuses={["PENDING_REVIEW", "RESUBMISSION_REQUIRED", "SIGNED", "REJECTED"]}
          />
        )}

        {isLoading ? (
          <ContractTableSkeleton variant="admin" />
        ) : isError ? (
          <EmptyState
            icon={<AlertTriangle className="text-destructive size-5" />}
            title="Could not load contracts"
            description={
              error instanceof ApiError ? error.message : "Please check your connection and retry."
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-5" />}
            title={hasFilters ? "No contracts match these filters" : "No contracts yet"}
            description={
              hasFilters
                ? "Try a different status filter, or clear the search box."
                : "Contracts created in the finance console appear here."
            }
          />
        ) : (
          <>
            <div className="space-y-3 sm:hidden">
              {items.map((item) => (
                <ContractMobileCard
                  key={item.contractId}
                  contractNumber={item.contractNumber}
                  status={item.status}
                  primaryLabel={item.candidateName ?? "Awaiting submission"}
                  phone={item.phone}
                  href={`/admin/${item.contractId}`}
                  actionLabel="View"
                />
              ))}
            </div>

            <div className="bg-card hidden overflow-hidden rounded-2xl shadow-xs sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-surface-subtle/60 hover:bg-surface-subtle/60 border-b">
                    <TableHead className={`px-4 ${HEAD_CLASS}`}>Contract #</TableHead>
                    <TableHead className={HEAD_CLASS}>Candidate</TableHead>
                    <TableHead className={HEAD_CLASS}>Phone</TableHead>
                    <TableHead className={HEAD_CLASS}>Status</TableHead>
                    <TableHead className={HEAD_CLASS}>Submitted</TableHead>
                    <TableHead className="w-20 px-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.contractId}
                      className="border-border hover:bg-surface-subtle/70 border-b last:border-0"
                    >
                      <TableCell className="text-muted-foreground px-4 py-3.5 font-mono text-xs">
                        {item.contractNumber}
                      </TableCell>
                      <TableCell className="text-foreground py-3.5 font-medium">
                        {item.candidateName ?? "—"}
                      </TableCell>
                      <TableCell className="py-3.5 tabular">
                        {normalizePhoneToLocal(item.phone)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground py-3.5 text-xs">
                        {item.submittedAt ? formatAgreementDate(item.submittedAt) : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <Button type="button" size="sm" variant="outline" asChild>
                          <Link href={`/admin/${item.contractId}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data && (
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
