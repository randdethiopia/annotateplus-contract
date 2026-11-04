"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCreateBatchCsv } from "@/lib/hooks/use-payouts";
import { describeError } from "@/lib/describe-error";
import { cn } from "@/lib/utils";

const MAX_CSV_BYTES = 5 * 1024 * 1024;

const EXPECTED_COLUMNS = [
  "contract_number",
  "worker_name",
  "bank_slug",
  "account_number",
  "amount",
];

function validateCsv(file: File): string | null {
  if (!/\.csv$/i.test(file.name)) return "Only .csv files can be staged";
  if (file.size === 0) return "That file is empty";
  if (file.size > MAX_CSV_BYTES) return "File is larger than 5 MB";
  return null;
}

function defaultTitle(file: File): string {
  return file.name.replace(/\.csv$/i, "").slice(0, 80) || "Payout batch";
}

export function CsvUploadSheet({
  token,
  onStaged,
}: {
  token: string;
  onStaged: (batchId: string) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: createBatch, isPending } = useCreateBatchCsv(token);

  function stage(file: File) {
    const problem = validateCsv(file);
    if (problem) {
      setError(problem);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(null);
    createBatch(
      { file, title: defaultTitle(file) },
      {
        onSuccess: (batch) => {
          toast.success(`Staged ${batch.totalItems.toLocaleString()} payments for review`);
          onStaged(batch.batchId);
          setOpen(false);
        },
        onError: (err) => {
          console.error("CSV staging failed", err);
          const message = describeError(err, "Could not stage this file");
          setError(message);
          toast.error(message);
        },
        onSettled: () => {
          if (inputRef.current) inputRef.current.value = "";
        },
      }
    );
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (isPending) return;
    const file = event.dataTransfer.files?.[0];
    if (file) stage(file);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          <UploadCloud className="size-4" aria-hidden />
          Upload payroll CSV
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-border border-b px-6 pt-6 pb-5">
          <SheetTitle className="text-lg">Stage a payout batch</SheetTitle>
          <SheetDescription>
            Upload a payroll CSV. Every row is validated server-side before anything is
            disbursed.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-6 py-6">
          <div
            role="button"
            tabIndex={isPending ? -1 : 0}
            aria-label="Stage a payout CSV"
            aria-describedby={error ? `${id}-error` : undefined}
            onClick={() => !isPending && inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (!isPending) inputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              if (isPending) return;
              dragDepth.current += 1;
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              dragDepth.current = Math.max(0, dragDepth.current - 1);
              if (dragDepth.current === 0) setIsDragging(false);
            }}
            onDrop={handleDrop}
            className={cn(
              "focus-visible:ring-ring flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              isPending && "pointer-events-none opacity-60",
              error
                ? "border-destructive/40 bg-destructive-soft"
                : isDragging
                  ? "border-action bg-action-soft"
                  : "border-border bg-surface-subtle hover:border-action/60 hover:bg-action-soft/50"
            )}
          >
            <input
              ref={inputRef}
              id={id}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={isPending}
              aria-invalid={!!error}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) stage(file);
              }}
            />
            {isPending ? (
              <>
                <Loader2 className="text-action size-6 animate-spin" aria-hidden />
                <span className="text-muted-foreground text-sm">Staging batch…</span>
              </>
            ) : (
              <>
                <span className="bg-card text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
                  {isDragging ? (
                    <FileSpreadsheet className="text-action size-5" aria-hidden />
                  ) : (
                    <UploadCloud className="size-5" aria-hidden />
                  )}
                </span>
                <span className="text-foreground text-sm font-semibold">
                  {isDragging ? "Drop to stage" : "Drop your payroll CSV here"}
                </span>
                <span className="text-muted-foreground text-xs">
                  or click to browse · .csv up to 5 MB
                </span>
              </>
            )}
          </div>

          {error && (
            <p id={`${id}-error`} role="alert" className="text-destructive text-xs font-medium">
              {error}
            </p>
          )}

          <div>
            <p className="text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
              Expected columns
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {EXPECTED_COLUMNS.map((column) => (
                <li
                  key={column}
                  className="font-mono text-xs text-slate-600 tabular"
                >
                  {column}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
