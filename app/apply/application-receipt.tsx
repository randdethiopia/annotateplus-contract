"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { CARD_SURFACE } from "./apply-controls";
import { cn } from "@/lib/utils";

export interface SubmittedApplication {
  firstName: string;
  fatherName: string;
  fullName: string;
  phone: string;
  region: string;
}

export function ApplicationReceipt({
  application,
  onReset,
}: {
  application: SubmittedApplication;
  onReset: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const rows = [
    { label: "Applicant Name", value: application.fullName },
    { label: "Phone Number", value: application.phone },
    { label: "Region", value: application.region },
    { label: "Status", value: "Under Review (NEW)" },
  ];

  return (
    <div className={cn(CARD_SURFACE, "mt-8 p-6 sm:p-12")}>
      <div className="flex flex-col items-center text-center">
        <span
          className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
          aria-hidden
        >
          <Check className="size-6" />
        </span>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-foreground mt-4 text-xl font-bold tracking-tight text-balance outline-none sm:text-2xl"
        >
          Application Submitted Successfully!
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md text-sm text-pretty">
          Thank you, {application.firstName} {application.fatherName}. Your profile has been
          registered in our recruitment pool.
        </p>
      </div>

      <dl className="mt-6 space-y-2 rounded-xl border border-slate-200/60 bg-slate-50 p-4 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-foreground tabular text-right font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="border-action/15 bg-action-soft mt-4 rounded-xl border p-4">
        <p className="text-foreground text-xs font-semibold">What happens next?</p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed text-pretty">
          Our recruitment team reviews applicants on a rolling basis. If your profile is selected,
          you will receive an official legal contract invitation via SMS on{" "}
          <span className="text-foreground tabular font-medium">{application.phone}</span>.
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
        >
          Submit another application
        </button>
      </div>
    </div>
  );
}
