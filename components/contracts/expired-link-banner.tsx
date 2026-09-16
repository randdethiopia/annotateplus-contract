"use client";

import { CalendarX } from "lucide-react";
import { RenewContractButton } from "@/components/contracts/renew-contract-button";
import { formatAgreementDate } from "@/lib/format-date";
import { MAX_REMINDERS } from "@/lib/reminder-utils";
import { RENEWAL_DAYS } from "@/lib/renew-utils";
import type { ContractDossierDto } from "@/types/backend";

/**
 * The lead element on a dossier whose signing window has closed.
 *
 * Amber here is deliberate and is not a contradiction of the gold rule in
 * globals.css: the surface states a condition, it is not an affordance. The
 * only clickable thing in it is the navy renew button.
 */
export function ExpiredLinkBanner({
  dossier,
  candidateName,
}: {
  dossier: ContractDossierDto;
  candidateName?: string;
}) {
  const remindersSent = dossier.reminderCount ?? 0;

  return (
    <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200/70">
      <div className="flex min-w-0 items-start gap-3.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"
          aria-hidden
        >
          <CalendarX className="size-4.5" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-semibold text-amber-950">
            {dossier.expiresAt ? (
              <>
                Signing link expired on{" "}
                <time dateTime={dossier.expiresAt}>
                  {formatAgreementDate(dossier.expiresAt)}
                </time>
              </>
            ) : (
              "Signing link expired"
            )}
          </h2>
          <p className="max-w-prose text-sm text-amber-900/80">
            The candidate was unable to complete signing within {RENEWAL_DAYS} days. No
            documents have been submitted yet.
            {remindersSent > 0 &&
              ` ${remindersSent} of ${MAX_REMINDERS} reminders were sent before the window closed.`}
          </p>
        </div>
      </div>

      <RenewContractButton
        contract={dossier}
        candidateName={candidateName}
        appearance="button"
        className="shrink-0 border-amber-300 bg-white hover:bg-amber-100"
      />
    </section>
  );
}
