"use client";

import type { ReactNode } from "react";
import { Bell, CalendarX, FileText, History, Send, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTRACT_TEMPLATES } from "@/lib/contract-templates";
import { formatAgreementDate, formatSignedDateTime } from "@/lib/format-date";
import { normalizePhoneToLocal } from "@/lib/phone";
import { MAX_REMINDERS } from "@/lib/reminder-utils";
import { DEFAULT_MAX_ATTEMPTS } from "@/lib/status-actions";
import { cn } from "@/lib/utils";
import type { ContractDossierDto } from "@/types/backend";

/**
 * A row is omitted rather than dashed when the backend has nothing to put in
 * it. An unsubmitted dossier is thin by nature, and a column of em-dashes reads
 * as a broken screen rather than an honest one.
 */
function Row({
  label,
  value,
  className,
}: {
  label: string;
  value?: ReactNode;
  className?: string;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <dt className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
        {label}
      </dt>
      <dd className={cn("text-foreground mt-0.5 text-sm font-semibold", className)}>{value}</dd>
    </div>
  );
}

function templateTitle(templateId?: string): string | undefined {
  if (!templateId) return undefined;
  // Resolve through the vaulted list so the human title stays in one place;
  // an unrecognised id still shows, rather than vanishing.
  const match = CONTRACT_TEMPLATES.find(
    (template) => template.id.toUpperCase() === templateId.toUpperCase()
  );
  return match ? match.title : templateId;
}

// ── Timeline ──────────────────────────────────────────────────────────────────

const EVENT_STYLE = {
  issued: { icon: Send, marker: "bg-action-soft text-action" },
  reminded: { icon: Bell, marker: "bg-slate-100 text-slate-600" },
  expired: { icon: CalendarX, marker: "bg-amber-50 text-amber-700" },
} as const;

interface TimelineEvent {
  key: keyof typeof EVENT_STYLE;
  title: string;
  detail?: string;
  at: string;
}

/**
 * Derived from the timestamps the dossier already carries — there is no
 * contract audit endpoint.
 *
 * A "candidate opened the link" event is deliberately absent: VIEWED is a
 * status the contract passes through, but no `viewedAt` timestamp is returned
 * by any endpoint, so the moment it happened is genuinely unknown and is not
 * something this component will invent.
 */
function buildTimeline(dossier: ContractDossierDto): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const reminders = dossier.reminderCount ?? 0;

  if (dossier.agreementDate) {
    events.push({
      key: "issued",
      title: "Contract issued",
      detail: "Invitation SMS dispatched to the candidate",
      at: dossier.agreementDate,
    });
  }

  if (reminders > 0 && dossier.lastReminderSentAt) {
    events.push({
      key: "reminded",
      title: `${reminders} of ${MAX_REMINDERS} reminders sent`,
      detail: "Last reminder SMS",
      at: dossier.lastReminderSentAt,
    });
  }

  if (dossier.status === "EXPIRED" && dossier.expiresAt) {
    events.push({
      key: "expired",
      title: "Signing link expired",
      detail: "The 30-day signing window elapsed",
      at: dossier.expiresAt,
    });
  }

  return events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

function ContractTimeline({ dossier }: { dossier: ContractDossierDto }) {
  const events = buildTimeline(dossier);
  if (events.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <h2 className="text-foreground text-base font-semibold tracking-tight">
          Contract timeline
        </h2>
      </div>

      <ol className="relative space-y-4">
        {events.map((event, index) => {
          const style = EVENT_STYLE[event.key];
          const Icon = style.icon;
          const isLast = index === events.length - 1;

          return (
            <li key={event.key} className="relative flex gap-3.5">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    style.marker
                  )}
                  aria-hidden
                >
                  <Icon className="size-4" />
                </span>
                {!isLast && <span className="bg-border mt-1 w-px flex-1" aria-hidden />}
              </div>

              <div className={cn("min-w-0 flex-1", !isLast && "pb-1")}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="text-foreground text-sm font-semibold">{event.title}</p>
                  <time dateTime={event.at} className="text-muted-foreground text-xs">
                    {formatSignedDateTime(event.at)}
                  </time>
                </div>
                {event.detail && (
                  <p className="text-muted-foreground mt-0.5 text-xs">{event.detail}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

/**
 * What a reviewer can see before the candidate has submitted anything.
 *
 * Without this the dossier for an INVITED, VIEWED or EXPIRED contract renders
 * as an empty page: every existing panel is keyed off the latest attempt, and
 * there is no attempt yet.
 */
export function PreSubmissionDossier({ dossier }: { dossier: ContractDossierDto }) {
  const template = templateTitle(dossier.templateId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="text-muted-foreground size-4 shrink-0" aria-hidden />
              Candidate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Row label="Full name" value={dossier.candidateName} />
              <Row
                label="Amharic name"
                value={dossier.candidateNameAmharic}
                className="font-ethiopic"
              />
              <Row
                label="Phone"
                value={normalizePhoneToLocal(dossier.phone)}
                className="font-mono tabular"
              />
              <Row label="Residence" value={dossier.residence} />
              <Row label="Role" value={dossier.roleTitle} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
              Agreement parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Row label="Template" value={template} />
              <Row
                label="Issued"
                value={dossier.agreementDate ? formatAgreementDate(dossier.agreementDate) : undefined}
              />
              {/* Typed as required, but a seeded or partially-migrated row can
                  still arrive without it, and this panel is the only thing on
                  the page — a throw here would blank the whole dossier. */}
              <Row
                label="Rate"
                value={
                  typeof dossier.ratePerTaskEtb === "number"
                    ? `${dossier.ratePerTaskEtb.toLocaleString()} ETB / task`
                    : undefined
                }
              />
              <Row
                label="Attempts"
                value={`${dossier.currentAttemptNumber} of ${dossier.maxAttempts || DEFAULT_MAX_ATTEMPTS}`}
              />
              <Row
                label="Reminders sent"
                value={`${dossier.reminderCount ?? 0} of ${MAX_REMINDERS}`}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <ContractTimeline dossier={dossier} />
    </div>
  );
}
