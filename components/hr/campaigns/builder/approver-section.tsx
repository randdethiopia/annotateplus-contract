"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Field } from "@/components/system/field";
import { SURFACE_CARD } from "@/components/system/surface";
import { Input } from "@/components/ui/input";
import { toEthiopianE164 } from "@/lib/campaign-math";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

export interface ApproverDraft {
  name: string;
  /** Digits typed after the fixed +251 prefix. */
  phone: string;
}

export function ApproverSection({
  value,
  onChange,
}: {
  value: ApproverDraft;
  onChange: (patch: Partial<ApproverDraft>) => void;
}) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneError =
    phoneTouched && value.phone && !toEthiopianE164(value.phone)
      ? "Enter a 9-digit Ethiopian mobile number starting with 9 or 7."
      : undefined;

  return (
    <section aria-labelledby="approver-heading" className={cn(SURFACE_CARD, "p-6")}>
      <SectionHeading
        id="approver-heading"
        step={3}
        title="Designated Approver (SMS OTP Verification)"
      />

      <div className="mt-6 grid gap-x-6 gap-y-5 md:grid-cols-2">
        <Field id="approver-name" label="Approver Full Name" required>
          <Input
            id="approver-name"
            value={value.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Brook Debela"
            autoComplete="off"
          />
        </Field>

        <Field
          id="approver-phone"
          label="Approver Mobile Phone"
          required
          error={phoneError}
          hint="The OTP is sent to this number."
        >
          <div className="relative">
            <span
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-sm font-medium text-slate-500"
              aria-hidden
            >
              +251
            </span>
            <Input
              id="approver-phone"
              type="tel"
              inputMode="tel"
              value={value.phone}
              onChange={(e) =>
                onChange({ phone: e.target.value.replace(/[^\d\s]/g, "").slice(0, 13) })
              }
              onBlur={() => setPhoneTouched(true)}
              placeholder="91 122 3344"
              autoComplete="off"
              aria-invalid={!!phoneError || undefined}
              aria-describedby={phoneError ? undefined : "approver-phone-prefix"}
              className="pl-16 font-mono tabular"
            />
            <span id="approver-phone-prefix" className="sr-only">
              Country code +251 is added automatically.
            </span>
          </div>
        </Field>
      </div>

      <div className="border-action/20 bg-action-soft/60 mt-6 flex items-start gap-3 rounded-xl border p-4">
        <ShieldCheck className="text-action mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="text-sm text-pretty text-slate-700">
          The designated manager will receive an AfroMessage SMS with a secure capability link and a
          25-minute One-Time Password (OTP) to review and authorize this disbursement.
        </p>
      </div>
    </section>
  );
}
