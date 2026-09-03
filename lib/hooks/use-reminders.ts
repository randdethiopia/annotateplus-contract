"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { financeApi } from "@/lib/api/finance.api";
import { reviewerApi } from "@/lib/api/reviewer.api";
import { describeError } from "@/lib/describe-error";
import type {
  ContractDossierDto,
  ContractListItemDto,
  FinanceContractListItemDto,
  Paginated,
  RemindContractResponse,
} from "@/types/backend";

/** Which endpoint family to nudge through — the two are role-scoped, not different actions. */
export type ReminderSurface = "reviewer" | "finance";

type RemindableRow = {
  contractId: string;
  reminderCount?: number;
  lastReminderSentAt?: string;
  nextReminderAt?: string;
};

function patchRow<T extends RemindableRow>(
  row: T,
  contractId: string,
  data: RemindContractResponse
): T {
  if (row.contractId !== contractId) return row;
  return {
    ...row,
    reminderCount: data.reminderCount,
    lastReminderSentAt: data.lastReminderSentAt,
    nextReminderAt: data.nextReminderAt,
  };
}

/**
 * Sends a reminder SMS and flips every cached view of the contract into its
 * cooldown state.
 *
 * The cache is patched from the response *before* the invalidations fire.
 * Invalidating alone is not enough: both queues use `placeholderData:
 * keepPreviousData`, so the stale row stays on screen for the whole refetch
 * and the button would keep reading "Send Reminder" — a live double-send
 * window. This is not `onMutate` optimism either; `nextReminderAt` is
 * unknowable before the response, so there is nothing to roll back.
 */
export function useRemindContract(token: string, surface: ReminderSurface) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractId: string) =>
      surface === "finance"
        ? financeApi.remindContract(token, contractId)
        : reviewerApi.remindContract(token, contractId),

    onSuccess: (data, contractId) => {
      // Prefix match, so every token/filter variant of the list is patched.
      // Typed separately per DTO so TS checks each updater against what is
      // really in that cache rather than a widened union.
      queryClient.setQueriesData<Paginated<ContractListItemDto>>(
        { queryKey: ["reviewer-contracts"] },
        (prev) =>
          prev && { ...prev, items: prev.items.map((row) => patchRow(row, contractId, data)) }
      );
      queryClient.setQueriesData<Paginated<FinanceContractListItemDto>>(
        { queryKey: ["finance-contracts"] },
        (prev) =>
          prev && { ...prev, items: prev.items.map((row) => patchRow(row, contractId, data)) }
      );
      // Exact key: the dossier query deliberately omits `token`.
      queryClient.setQueryData<ContractDossierDto>(
        ["reviewer-contract", contractId],
        (prev) => prev && patchRow(prev, contractId, data)
      );

      toast.success("Reminder SMS dispatched to candidate");

      // Deliberately not `invalidateReviewerMutations`: a reminder never moves a
      // contract's status, so refetching the four reviewer-kpis count queries
      // on every nudge is pure waste.
      queryClient.invalidateQueries({ queryKey: ["reviewer-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["reviewer-contract", contractId] });
      queryClient.invalidateQueries({ queryKey: ["finance-contracts"] });
    },

    // Unlike the other mutation hooks in this codebase the toasts live here
    // rather than at the call site: the copy depends on the response count and
    // on ApiError.retryAfterSeconds, and four surfaces fire this same action.
    onError: (err) => {
      console.error("Reminder send failed", err);

      if (err instanceof ApiError && err.status === 429) {
        toast.error(
          err.retryAfterSeconds
            ? `Cooldown still active — try again in ${Math.max(
                1,
                Math.ceil(err.retryAfterSeconds / 3600)
              )}h`
            : err.message
        );
        return;
      }

      toast.error(describeError(err, "Could not send reminder"));
    },
  });
}
