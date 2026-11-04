"use client";

import { memo, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Search, SearchX, Users, X } from "lucide-react";
import { SURFACE_CARD } from "@/components/system/surface";
import { QueueShell } from "@/components/system/queue-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EMPTY_ROW,
  fromCents,
  netPayableCents,
  sanitizeAmountInput,
  sanitizeCountInput,
  type WorkerRowDraft,
} from "@/lib/campaign-math";
import { describeError } from "@/lib/describe-error";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CampaignCompensationModel, ContractListItemDto } from "@/types/backend";
import { SectionHeading } from "./section-heading";

export const MATRIX_REGION_ID = "campaign-worker-matrix";

type MatrixView = "ALL" | "ENROLLED";

export type RowChangeHandler = (contractId: string, patch: Partial<WorkerRowDraft>) => void;

const HEAD_CELL =
  "px-4 py-3 align-middle text-[11px] font-semibold tracking-[0.1em] whitespace-nowrap text-slate-500 uppercase";

const CELL_INPUT =
  "rounded border border-slate-200 bg-white px-2 py-1 font-mono text-sm text-slate-900 tabular transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-900/10 focus:outline-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-slate-300 disabled:placeholder:text-slate-300";

function workerName(worker: ContractListItemDto): string {
  return worker.candidateName ?? "Unnamed annotator";
}

function CellInput({
  value,
  onChange,
  kind,
  label,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  kind: "count" | "amount";
  label: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type="text"
      inputMode={kind === "count" ? "numeric" : "decimal"}
      value={value}
      onChange={(e) =>
        onChange(
          kind === "count" ? sanitizeCountInput(e.target.value) : sanitizeAmountInput(e.target.value)
        )
      }
      placeholder={placeholder}
      aria-label={label}
      disabled={disabled}
      autoComplete="off"
      className={cn(CELL_INPUT, className)}
    />
  );
}

function BankAccount({ worker }: { worker: ContractListItemDto }) {
  if (!worker.bankName && !worker.bankAccountMasked) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  return (
    <span className="text-xs whitespace-nowrap text-slate-700">
      {worker.bankName ?? "—"}
      <span className="mx-1.5 text-slate-300" aria-hidden>
        ·
      </span>
      <span className="font-mono text-slate-500 tabular">{worker.bankAccountMasked ?? "—"}</span>
    </span>
  );
}

interface RowProps {
  worker: ContractListItemDto;
  draft: WorkerRowDraft;
  model: CampaignCompensationModel;
  defaultRate: string;
  /** Enrolled server-side by an earlier, partly failed submission — cannot be removed here. */
  locked: boolean;
  onRowChange: RowChangeHandler;
}

function useRowCells({ worker, draft, model, defaultRate, onRowChange }: RowProps) {
  const name = workerName(worker);
  const isFixed = model === "FIXED";
  const disabled = !draft.enrolled;
  const set = (patch: Partial<WorkerRowDraft>) => onRowChange(worker.contractId, patch);
  const net = draft.enrolled
    ? formatEtb(fromCents(netPayableCents(draft, model, defaultRate)))
    : "—";

  return {
    name,
    net,
    tasks: (className?: string) => (
      <CellInput
        kind="count"
        value={isFixed ? "" : draft.tasks}
        onChange={(tasks) => set({ tasks })}
        label={`Tasks for ${name}`}
        placeholder={isFixed ? "—" : "0"}
        disabled={disabled || isFixed}
        className={cn("text-center", className)}
      />
    ),
    rate: (className?: string) => (
      // The placeholder *is* the inherited default, in a lighter ink, so an
      // overridden row reads differently from one that follows the campaign.
      <CellInput
        kind="amount"
        value={draft.rate ?? ""}
        onChange={(rate) => set({ rate: rate === "" ? null : rate })}
        label={`${isFixed ? "Fee" : "Rate"} for ${name}`}
        placeholder={defaultRate || "0.00"}
        disabled={disabled}
        className={cn("text-right", className)}
      />
    ),
    bonus: (className?: string) => (
      <CellInput
        kind="amount"
        value={draft.bonus}
        onChange={(bonus) => set({ bonus })}
        label={`Bonus for ${name}`}
        placeholder="0.00"
        disabled={disabled}
        className={cn("text-right", className)}
      />
    ),
    deduction: (className?: string) => (
      <CellInput
        kind="amount"
        value={draft.deduction}
        onChange={(deduction) => set({ deduction })}
        label={`Deduction for ${name}`}
        placeholder="0.00"
        disabled={disabled}
        className={cn("text-right", className)}
      />
    ),
  };
}

const MatrixRow = memo(function MatrixRow(props: RowProps) {
  const { worker, draft, locked, onRowChange } = props;
  const cells = useRowCells(props);
  const checkboxId = `enroll-${worker.contractId}`;

  return (
    <tr
      className={cn(
        "border-b border-slate-100 transition-colors last:border-0",
        draft.enrolled ? "bg-white" : "bg-white hover:bg-slate-50/70"
      )}
    >
      <td className="w-12 py-3 pr-2 pl-6">
        <Checkbox
          id={checkboxId}
          checked={draft.enrolled}
          disabled={locked}
          onCheckedChange={(checked) =>
            onRowChange(worker.contractId, { enrolled: checked === true })
          }
          aria-label={`Enroll ${cells.name}`}
        />
      </td>
      <td className="px-4 py-3">
        <label htmlFor={checkboxId} className="block cursor-pointer">
          <span className="block truncate text-sm font-semibold text-slate-900">{cells.name}</span>
          {worker.candidateNameAmharic && (
            <span className="font-ethiopic block truncate text-xs text-slate-500">
              {worker.candidateNameAmharic}
            </span>
          )}
        </label>
      </td>
      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-500 tabular">
        {worker.contractNumber}
      </td>
      <td className="px-4 py-3">
        <BankAccount worker={worker} />
      </td>
      <td className="px-4 py-3 text-center">{cells.tasks("w-20")}</td>
      <td className="px-4 py-3 text-right">{cells.rate("w-24")}</td>
      <td className="px-4 py-3 text-right">{cells.bonus("w-24")}</td>
      <td className="px-4 py-3 text-right">{cells.deduction("w-24")}</td>
      <td
        className={cn(
          "py-3 pr-6 pl-4 text-right font-mono text-sm font-semibold whitespace-nowrap tabular",
          draft.enrolled ? "text-slate-900" : "text-slate-300"
        )}
      >
        {cells.net}
      </td>
    </tr>
  );
});

const MatrixCard = memo(function MatrixCard(props: RowProps) {
  const { worker, draft, model, locked, onRowChange } = props;
  const cells = useRowCells(props);
  const checkboxId = `enroll-card-${worker.contractId}`;

  const field = (label: string, input: ReactNode) => (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">{label}</p>
      {input}
    </div>
  );

  return (
    <li className="border-b border-slate-100 px-5 py-4 last:border-0">
      <div className="flex items-start gap-3">
        <Checkbox
          id={checkboxId}
          checked={draft.enrolled}
          disabled={locked}
          onCheckedChange={(checked) =>
            onRowChange(worker.contractId, { enrolled: checked === true })
          }
          aria-label={`Enroll ${cells.name}`}
          className="mt-0.5"
        />
        <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer">
          <span className="block truncate text-sm font-semibold text-slate-900">{cells.name}</span>
          <span className="block font-mono text-xs text-slate-500 tabular">
            {worker.contractNumber}
          </span>
          <span className="mt-1 block">
            <BankAccount worker={worker} />
          </span>
        </label>
      </div>

      {draft.enrolled && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {field("Tasks", cells.tasks("w-full"))}
            {field(model === "FIXED" ? "Fee (ETB)" : "Rate (ETB)", cells.rate("w-full"))}
            {field("Bonus (ETB)", cells.bonus("w-full"))}
            {field("Deduction (ETB)", cells.deduction("w-full"))}
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
            <span className="text-xs font-medium text-slate-500">Net payable</span>
            <span className="font-mono text-sm font-semibold text-slate-900 tabular">
              {cells.net}
            </span>
          </div>
        </>
      )}
    </li>
  );
});

function MatrixMessage({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-t border-slate-100 px-6 py-14 text-center">
      <span
        className="bg-surface-subtle text-muted-foreground mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl"
        aria-hidden
      >
        {icon}
      </span>
      <p className="text-foreground text-sm font-semibold">{title}</p>
      {description && (
        <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm text-pretty">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

function MatrixSkeleton() {
  return (
    <div className="border-t border-slate-100" aria-busy="true" aria-label="Loading signed annotators">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div
          key={row}
          className="flex animate-pulse items-center gap-6 border-b border-slate-100 px-6 py-4 last:border-0 motion-reduce:animate-none"
        >
          <div className="size-5 shrink-0 rounded-md bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-full max-w-40 rounded bg-slate-100" />
            <div className="h-2.5 w-24 rounded bg-slate-100" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-slate-100 lg:block" />
          <div className="hidden h-3 w-32 rounded bg-slate-100 lg:block" />
          <div className="hidden h-7 w-20 rounded bg-slate-100 lg:block" />
          <div className="hidden h-7 w-24 rounded bg-slate-100 lg:block" />
          <div className="hidden h-7 w-24 rounded bg-slate-100 lg:block" />
          <div className="hidden h-7 w-24 rounded bg-slate-100 lg:block" />
          <div className="h-3 w-24 shrink-0 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function WorkerMatrix({
  workers,
  totalSigned,
  isPending,
  isFetching,
  isError,
  error,
  onRetry,
  rows,
  model,
  defaultRate,
  lockedIds,
  enrolledCount,
  onRowChange,
  onSetEnrolled,
}: {
  workers: ContractListItemDto[];
  /** Server total, which can exceed the rows loaded. */
  totalSigned: number;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  rows: Record<string, WorkerRowDraft>;
  model: CampaignCompensationModel;
  defaultRate: string;
  lockedIds: Record<string, string>;
  enrolledCount: number;
  onRowChange: RowChangeHandler;
  onSetEnrolled: (contractIds: string[], enrolled: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<MatrixView>("ALL");

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workers.filter((worker) => {
      if (view === "ENROLLED" && !rows[worker.contractId]?.enrolled) return false;
      if (!query) return true;
      return (
        workerName(worker).toLowerCase().includes(query) ||
        worker.contractNumber.toLowerCase().includes(query) ||
        (worker.candidateNameAmharic ?? "").includes(search.trim())
      );
    });
  }, [rows, search, view, workers]);

  const visibleEnrolled = visible.filter((w) => rows[w.contractId]?.enrolled).length;
  const selectAllState =
    visible.length > 0 && visibleEnrolled === visible.length
      ? true
      : visibleEnrolled > 0
        ? "indeterminate"
        : false;

  function toggleAllVisible() {
    const ids = visible.map((w) => w.contractId);
    if (selectAllState === true) {
      onSetEnrolled(
        ids.filter((id) => !(id in lockedIds)),
        false
      );
    } else {
      onSetEnrolled(ids, true);
    }
  }

  const tabs: { value: MatrixView; label: string; count: number }[] = [
    { value: "ALL", label: "All Signed", count: totalSigned },
    { value: "ENROLLED", label: "Enrolled in Campaign", count: enrolledCount },
  ];

  const rateHeader = model === "FIXED" ? "Fee (ETB)" : "Rate (ETB)";
  const hasQuery = search.trim().length > 0;

  const rowProps = (worker: ContractListItemDto): RowProps => ({
    worker,
    draft: rows[worker.contractId] ?? EMPTY_ROW,
    model,
    defaultRate,
    locked: worker.contractId in lockedIds,
    onRowChange,
  });

  return (
    <section aria-labelledby="worker-matrix-heading" className={SURFACE_CARD}>
      <div className="space-y-5 p-6">
        <SectionHeading
          id="worker-matrix-heading"
          step={2}
          title="Worker Enrollment & Compensation"
          description="Select signed annotators and set what each one is owed for this run."
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-96">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && search) {
                    e.preventDefault();
                    setSearch("");
                  }
                }}
                placeholder="Filter signed annotators by name or contract №…"
                aria-label="Filter signed annotators"
                aria-controls={MATRIX_REGION_ID}
                autoComplete="off"
                spellCheck={false}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-9 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear filter"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div
              role="group"
              aria-label="Show annotators"
              className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200/60 bg-slate-100/80 p-1"
            >
              {tabs.map((tab) => {
                const isActive = view === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    aria-pressed={isActive}
                    aria-controls={MATRIX_REGION_ID}
                    onClick={() => setView(tab.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none",
                      isActive
                        ? "bg-white font-semibold text-slate-900 shadow-xs"
                        : "font-medium text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {tab.label}
                    <span className="inline-block min-w-[1ch] text-slate-400 tabular">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 select-none">
            <Checkbox
              checked={selectAllState}
              disabled={visible.length === 0}
              onCheckedChange={toggleAllVisible}
              aria-controls={MATRIX_REGION_ID}
            />
            {hasQuery || view === "ENROLLED" ? "Select all shown" : "Select all"}
          </label>
        </div>

        {totalSigned > workers.length && (
          <p className="text-xs text-slate-500">
            Showing the first <span className="tabular">{workers.length}</span> of{" "}
            <span className="tabular">{totalSigned}</span> signed annotators.
          </p>
        )}
      </div>

      <QueueShell
        id={MATRIX_REGION_ID}
        isPending={isPending}
        isFetching={isFetching}
        isError={isError}
        hasData={workers.length > 0}
        isEmpty={visible.length === 0}
        skeleton={<MatrixSkeleton />}
        error={
          <MatrixMessage
            icon={<AlertTriangle className="text-destructive size-5" />}
            title="Could not load signed annotators"
            description={describeError(error, "The signed contracts could not be read")}
            action={
              <Button type="button" variant="outline" onClick={onRetry}>
                Try again
              </Button>
            }
          />
        }
        empty={
          workers.length === 0 ? (
            <MatrixMessage
              icon={<Users className="size-5" />}
              title="No signed annotators yet."
              description="Workers appear here once their contract is approved and sealed."
            />
          ) : view === "ENROLLED" && !hasQuery ? (
            <MatrixMessage
              icon={<Users className="size-5" />}
              title="No annotators enrolled yet."
              description="Tick annotators in the All Signed view to add them to this campaign."
              action={
                <Button type="button" variant="outline" onClick={() => setView("ALL")}>
                  Show all signed
                </Button>
              }
            />
          ) : (
            <MatrixMessage
              icon={<SearchX className="size-5" />}
              title="No annotators match this filter."
              description="Try a different name or contract number."
              action={
                <Button type="button" variant="outline" onClick={() => setSearch("")}>
                  Clear filter
                </Button>
              }
            />
          )
        }
      >
        <ul className="border-t border-slate-100 lg:hidden">
          {visible.map((worker) => (
            <MatrixCard key={worker.contractId} {...rowProps(worker)} />
          ))}
        </ul>

        <div className="hidden overflow-x-auto border-t border-slate-200 lg:block">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th scope="col" className={cn(HEAD_CELL, "w-12 pr-2 pl-6")}>
                  <span className="sr-only">Enrolled</span>
                </th>
                <th scope="col" className={cn(HEAD_CELL, "text-left")}>
                  Annotator
                </th>
                <th scope="col" className={cn(HEAD_CELL, "text-left")}>
                  Contract №
                </th>
                <th scope="col" className={cn(HEAD_CELL, "text-left")}>
                  Bank &amp; Account
                </th>
                <th scope="col" className={cn(HEAD_CELL, "text-center")}>
                  Tasks
                </th>
                <th scope="col" className={cn(HEAD_CELL, "text-right")}>
                  {rateHeader}
                </th>
                <th scope="col" className={cn(HEAD_CELL, "text-right")}>
                  Bonus (ETB)
                </th>
                <th scope="col" className={cn(HEAD_CELL, "text-right")}>
                  Deduction (ETB)
                </th>
                <th scope="col" className={cn(HEAD_CELL, "pr-6 text-right")}>
                  Net Payable
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((worker) => (
                <MatrixRow key={worker.contractId} {...rowProps(worker)} />
              ))}
            </tbody>
          </table>
        </div>
      </QueueShell>
    </section>
  );
}
