"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, FileText, Loader2, Plus } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyValueButton } from "@/components/contracts/copy-value-button";
import { Field } from "@/components/system/field";
import { useAuth } from "@/lib/auth/auth-context";
import {
  CONTRACT_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  type ContractTemplate,
} from "@/lib/contract-templates";
import { useCreateContract } from "@/lib/hooks/use-finance";
import { describeError } from "@/lib/describe-error";
import {
  createContractSchema,
  type CreateContractFormValues,
  type CreateContractInput,
} from "@/lib/validations/contract.schema";
import type { CreateContractResponseData, SmsDispatchStatus } from "@/types/backend";

const DEFAULTS: CreateContractFormValues = { templateId: DEFAULT_TEMPLATE_ID, phone: "" };

/**
 * The response omits `smsStatus` when the backend dispatches out of band, so
 * the fallback states the request was made rather than asserting delivery —
 * finance decides from this whether the backup link needs sharing.
 */
const SMS_STATUS: Record<SmsDispatchStatus, { label: string; className: string }> = {
  SENT: { label: "Delivered to AfroMessage", className: "bg-emerald-100 text-emerald-800" },
  QUEUED: { label: "Queued for dispatch", className: "bg-amber-100 text-amber-900" },
  FAILED: {
    label: "Dispatch failed — share the backup link below",
    className: "bg-destructive-soft text-destructive",
  },
};

/**
 * Rendered both in the select trigger and in each option, so the two never
 * drift. Spans only — Radix clones this into the trigger, where a div is
 * invalid inside the value's span.
 */
function TemplateSummary({ template }: { template: ContractTemplate }) {
  return (
    <span className="flex w-full flex-col items-start gap-1.5 text-left">
      <span className="flex w-full items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0" aria-hidden />
          <span className="text-foreground truncate text-sm font-medium">{template.title}</span>
        </span>
        <Badge variant="secondary" className="shrink-0 text-[11px] font-normal">
          Official Active Template
        </Badge>
      </span>
      <span className="text-muted-foreground line-clamp-2 pl-6 text-left text-xs leading-relaxed">
        {template.description}
      </span>
    </span>
  );
}

function buildInviteLink(invitePath: string): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}${invitePath}`;
}

export function CreateContractDialog() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CreateContractResponseData | null>(null);
  // The response does not echo the phone back and `reset()` clears the field,
  // so the recipient shown on the success panel is captured at submit time.
  const [issuedPhone, setIssuedPhone] = useState("");

  const { mutate: createContract, isPending } = useCreateContract(token ?? "");

  const {
    control,
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<CreateContractFormValues, unknown, CreateContractInput>({
    resolver: zodResolver(createContractSchema),
    defaultValues: DEFAULTS,
  });

  // useWatch, not watch(): watch() returns a function the React Compiler cannot
  // memoize, which opts the component out of auto-memoization.
  const templateId = useWatch({ control, name: "templateId" });
  const selectedTemplate =
    CONTRACT_TEMPLATES.find((t) => t.id === templateId) ?? CONTRACT_TEMPLATES[0];

  function clearForm() {
    reset(DEFAULTS);
    setResult(null);
    setIssuedPhone("");
  }

  function closeDialog() {
    setOpen(false);
    clearForm();
  }

  function onSubmit(values: CreateContractInput) {
    setIssuedPhone(values.phone);
    createContract(
      { phone: values.phone, templateId: values.templateId || DEFAULT_TEMPLATE_ID },
      {
        onSuccess: (data) => setResult(data),
        onError: (err) => {
          console.error("Create contract failed", err);
          toast.error(describeError(err, "Could not issue contract"));
        },
      }
    );
  }

  const inviteLink = result ? buildInviteLink(result.inviteLink) : "";
  const smsStatus = result?.smsStatus ? SMS_STATUS[result.smsStatus] : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else closeDialog();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" className="flex-1 sm:flex-none">
          <Plus className="size-4" />
          New Contract
        </Button>
      </DialogTrigger>

      {/*
        The dialog is a column: pinned header, scrolling body, pinned footer.
        DialogContent is centred with translate(-50%,-50%) and had no height cap,
        so a tall form grew past the viewport and its top and bottom became
        unreachable — there was nothing to scroll. Capping the height without
        giving the middle its own scroll would clip instead, so both are needed.
      */}
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          // Radix focuses the first tabbable node — the template trigger — so a
          // bare autoFocus on the phone input is silently ignored. The template
          // is already correct by default; the phone is what needs typing.
          if (result) return;
          event.preventDefault();
          setFocus("phone");
        }}
      >
        {result ? (
          <>
            <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
              <DialogTitle className="text-lg font-semibold">
                Contract Issued &amp; SMS Dispatched
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-0.5 text-xs">
                The worker has been sent their signing link by SMS.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                <div className="min-w-0 space-y-2">
                  <p>
                    Contract{" "}
                    <span className="font-mono font-medium">{result.contractNumber}</span> was
                    issued to <span className="tabular font-medium">{issuedPhone}</span>.
                  </p>
                  {smsStatus ? (
                    <Badge className={smsStatus.className}>{smsStatus.label}</Badge>
                  ) : (
                    <Badge variant="secondary">Dispatch requested</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium">Contract number</p>
                <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">
                    {result.contractNumber}
                  </span>
                  <CopyValueButton value={result.contractNumber} label="Contract number" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div>
                  <p className="text-sm font-medium">Backup sharing link</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Optional — share directly via Telegram, WhatsApp, or email if the SMS
                    doesn&apos;t arrive.
                  </p>
                </div>
                <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{inviteLink}</span>
                  <CopyValueButton value={inviteLink} label="Invite link" />
                </div>
              </div>
            </div>

            <div className="bg-muted/40 flex shrink-0 items-center justify-end gap-3 border-t px-6 py-4">
              <Button type="button" variant="ghost" onClick={clearForm}>
                Issue Another
              </Button>
              <Button type="button" className="h-11" onClick={closeDialog}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
            <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
              <DialogTitle className="text-lg font-semibold">Issue New Contract</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-0.5 text-xs">
                Select the agreement template and enter the worker&apos;s phone. The contract
                number is assigned automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <Field id="templateId" label="Agreement Template" error={errors.templateId?.message}>
                <Controller
                  control={control}
                  name="templateId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      {/* The shared trigger is w-fit, fixed-height and nowrap —
                          all three clip a template's two-line summary. */}
                      <SelectTrigger
                        id="templateId"
                        aria-invalid={!!errors.templateId}
                        // The base trigger locks height via `data-[size=default]:h-10`
                        // (select.tsx) — an unscoped `h-auto` loses that specificity
                        // fight, so the override has to match the same modifier to
                        // get deduped in. Same story for `*:data-[slot=select-value]`:
                        // it's the only selector that reaches the value span, so
                        // undoing its line-clamp/alignment has to go through it too.
                        className="h-auto min-h-19 w-full items-start justify-between gap-2 p-3.5 text-left whitespace-normal data-[size=default]:h-auto *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:w-full *:data-[slot=select-value]:items-start"
                      >
                        {/* Rendering the summary here rather than letting
                            SelectValue clone the item keeps the trigger's layout
                            independent of the option list's. */}
                        <SelectValue>
                          <TemplateSummary template={selectedTemplate} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        align="start"
                        className="w-(--radix-select-trigger-width)"
                      >
                        {CONTRACT_TEMPLATES.map((template) => (
                          <SelectItem key={template.id} value={template.id} className="py-2">
                            <TemplateSummary template={template} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field
                id="phone"
                label="Worker Mobile Phone Number"
                hint="The capability signing link will be dispatched to this number via SMS."
                error={errors.phone?.message}
                className="pt-1.5"
              >
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+2519... or 09..."
                  aria-invalid={!!errors.phone}
                  className="tabular"
                  {...register("phone")}
                />
              </Field>
            </div>

            <div className="bg-muted/40 flex shrink-0 items-center justify-end gap-3 border-t px-6 py-4">
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" className="h-11" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Issuing & Dispatching SMS…" : "Issue Contract & Dispatch SMS"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
