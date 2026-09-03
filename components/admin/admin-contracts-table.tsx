"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/system/status-badge";
import { ContractMobileCard } from "@/components/contracts/contract-mobile-card";
import { normalizePhoneToLocal } from "@/lib/phone";
import { formatAgreementDate } from "@/lib/format-date";
import type { ContractListItemDto } from "@/types/backend";

const HEAD_CLASS = "text-muted-foreground text-[11px] font-semibold tracking-wider uppercase";

/**
 * Rows only — extracted from the admin page so that surface has a single grid
 * child, the way HR and finance do. Loading, empty and error states belong to
 * `QueueShell`.
 */
export function AdminContractsTable({ items }: { items: ContractListItemDto[] }) {
  return (
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
    </>
  );
}
