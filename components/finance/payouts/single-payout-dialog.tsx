"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/system/field";
import { SEARCH_DEBOUNCE_MS } from "@/components/system/workstation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useFinanceContracts } from "@/lib/hooks/use-finance";
import { useSingleTransfer } from "@/lib/hooks/use-payouts";
import { describeError } from "@/lib/describe-error";
import { formatEtb } from "@/lib/money";
import { singleTransferSchema, type SingleTransferInput } from "@/lib/validations/payout.schema";
import { cn } from "@/lib/utils";
import type { FinanceContractListItemDto } from "@/types/backend";

const DEFAULTS: SingleTransferInput = {
  contractId: "",
  amount: 0,
  paymentReason: "",
};

export function SinglePayoutDialog({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState<FinanceContractListItemDto | null>(null);
  const search = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SingleTransferInput>({
    resolver: zodResolver(singleTransferSchema),
    defaultValues: DEFAULTS,
  });

  const { data, isFetching } = useFinanceContracts(token, {
    status: "SIGNED",
    search: search.trim() || undefined,
    page: 1,
    limit: 6,
  });

  const { mutate: transfer, isPending } = useSingleTransfer(token);
  const results = data?.items ?? [];

  function closeDialog() {
    setOpen(false);
    reset(DEFAULTS);
    setDraft("");
    setPicked(null);
  }

  function pick(item: FinanceContractListItemDto) {
    setPicked(item);
    setValue("contractId", item.contractId, { shouldValidate: true });
  }

  function onSubmit(values: SingleTransferInput) {
    transfer(values, {
      onSuccess: (result) => {
        toast.success(
          `Transfer of ${formatEtb(result.amount)} dispatched to ${
            picked?.workerName ?? "worker"
          }.`
        );
        closeDialog();
      },
      onError: (err) => {
        console.error("Single transfer failed", err);
        toast.error(describeError(err, "Could not dispatch transfer"));
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        if (next) setOpen(true);
        else closeDialog();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Plus className="size-4" aria-hidden />
          Single transfer
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold">Single payout</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-0.5 text-xs">
            Disburse one transfer against a signed contract. This cannot be recalled.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <Field
              id="payout-contract"
              label="Signed contract"
              error={errors.contractId?.message}
              hint="Search by worker name, phone or contract number."
              required
            >
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  id="payout-contract"
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Search signed contracts…"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!!errors.contractId}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-9 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                />
                {isFetching && (
                  <Loader2
                    className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-slate-400"
                    aria-hidden
                  />
                )}
              </div>

              <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto">
                {results.length === 0 && !isFetching && (
                  <li className="text-muted-foreground px-1 py-2 text-xs">
                    No signed contracts match that search.
                  </li>
                )}
                {results.map((item) => {
                  const isPicked = picked?.contractId === item.contractId;
                  return (
                    <li key={item.contractId}>
                      <button
                        type="button"
                        onClick={() => pick(item)}
                        aria-pressed={isPicked}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none",
                          isPicked
                            ? "bg-action-soft text-slate-900"
                            : "hover:bg-surface-subtle text-slate-700"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {item.workerName ?? "Unnamed worker"}
                          </span>
                          <span className="block font-mono text-xs text-slate-500 tabular">
                            {item.contractNumber}
                          </span>
                        </span>
                        {isPicked && <Check className="text-action size-4 shrink-0" aria-hidden />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Field>

            <Field
              id="payout-amount"
              label="Amount (ETB)"
              error={errors.amount?.message}
              required
            >
              <Input
                id="payout-amount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="2500.00"
                aria-invalid={!!errors.amount}
                className="font-mono tabular"
                {...register("amount", { valueAsNumber: true })}
              />
            </Field>

            <Field
              id="payout-reason"
              label="Payment reason"
              error={errors.paymentReason?.message}
              required
            >
              <Input
                id="payout-reason"
                type="text"
                placeholder="Weekly annotation payout"
                aria-invalid={!!errors.paymentReason}
                {...register("paymentReason")}
              />
            </Field>
          </div>

          <DialogFooter className="bg-muted/40 flex shrink-0 items-center justify-end gap-3 border-t px-6 py-4">
            <Button type="button" variant="ghost" onClick={closeDialog} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {isPending ? "Dispatching…" : "Dispatch transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
