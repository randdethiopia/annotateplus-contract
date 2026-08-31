"use client";

import { useRef, useState, type DragEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCircle2, Copy, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { useCreateContract } from "@/lib/hooks/use-finance";
import { describeError } from "@/lib/describe-error";
import {
  createContractSchema,
  type CreateContractFormInput,
} from "@/lib/validations/contract.schema";
import { cn } from "@/lib/utils";
import type { CreateContractResponseData } from "@/types/backend";

const DEFAULT_CONTRACT_NUMBER = "R&D/EOC/InnC/0001/26";
const DEFAULT_RATE_PER_TASK_ETB = 100;

const LABEL = "text-xs font-semibold text-slate-700";
const CONTROL =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none";
const ERROR_TEXT = "text-destructive text-xs font-medium";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizePdfFile(file: File): File {
  const name = file.name.toLowerCase().endsWith(".pdf") ? file.name : `${file.name}.pdf`;
  if (file.type === "application/pdf" && file.name === name) return file;
  return new File([file], name, { type: "application/pdf" });
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
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: createContract, isPending } = useCreateContract(token ?? "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateContractFormInput>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      contractNumber: DEFAULT_CONTRACT_NUMBER,
      phone: "",
      ratePerTaskEtb: DEFAULT_RATE_PER_TASK_ETB,
      contractPdf: undefined as unknown as File,
    },
  });

  const contractPdf = watch("contractPdf");

  function resetDialog() {
    setOpen(false);
    reset({
      contractNumber: DEFAULT_CONTRACT_NUMBER,
      phone: "",
      ratePerTaskEtb: DEFAULT_RATE_PER_TASK_ETB,
      contractPdf: undefined as unknown as File,
    });
    setResult(null);
    setCopied(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function selectPdf(file: File) {
    setValue("contractPdf", normalizePdfFile(file), { shouldValidate: true });
  }

  function clearPdf() {
    setValue("contractPdf", undefined as unknown as File, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) selectPdf(file);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) selectPdf(file);
  }

  function onSubmit(values: CreateContractFormInput) {
    createContract(values, {
      onSuccess: (data) => setResult(data),
      onError: (err) => {
        console.error("Create contract failed", err);
        toast.error(describeError(err, "Could not create contract"));
      },
    });
  }

  const inviteLink = result ? buildInviteLink(result.inviteLink) : "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy — your browser blocked clipboard access.");
    }
  }

  const hasPdf = contractPdf instanceof File && contractPdf.size > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else resetDialog();
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
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {result ? (
          <>
            <DialogHeader className="shrink-0 border-b border-slate-100 px-6 pt-6 pb-4">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Contract issued &amp; SMS dispatched
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-slate-500">
                The worker has been sent their signing link by SMS.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                <span>
                  An invitation SMS with the signing link has been sent to the worker&apos;s
                  phone.
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <p className={LABEL}>Backup sharing link</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Optional — share directly via Telegram, WhatsApp, or email if the SMS
                    doesn&apos;t arrive.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-700">
                    {inviteLink}
                  </span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Copy invite link"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <Button type="button" onClick={resetDialog}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
            <DialogHeader className="shrink-0 border-b border-slate-100 px-6 pt-6 pb-4">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Issue New Contract
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-slate-500">
                Upload the agreement template and enter worker details to dispatch the signing
                link.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="space-y-1.5">
                <label htmlFor="contractPdf" className={cn(LABEL, "block")}>
                  Contract agreement (PDF)
                </label>
                <input
                  ref={fileInputRef}
                  id="contractPdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                {hasPdf ? (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
                      aria-hidden
                    >
                      <FileText className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {contractPdf.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(contractPdf.size)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Remove PDF"
                        onClick={clearPdf}
                        className="text-slate-400 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="contractPdf"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors",
                      errors.contractPdf
                        ? "border-destructive/40 bg-destructive-soft"
                        : isDragging
                          ? "border-slate-400 bg-slate-100"
                          : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <FileText className="size-6 text-slate-400" aria-hidden />
                    <span className="text-sm font-medium text-slate-700">
                      Drop contract PDF here or click to browse
                    </span>
                    <span className="text-xs text-slate-500">PDF only · up to 10MB</span>
                  </label>
                )}
                {errors.contractPdf && (
                  <p role="alert" className={ERROR_TEXT}>
                    {errors.contractPdf.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contractNumber" className={cn(LABEL, "block")}>
                  Contract Number
                </label>
                <input
                  id="contractNumber"
                  aria-invalid={!!errors.contractNumber}
                  className={cn(CONTROL, "font-mono")}
                  {...register("contractNumber")}
                />
                {errors.contractNumber && (
                  <p role="alert" className={ERROR_TEXT}>
                    {errors.contractNumber.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="phone" className={cn(LABEL, "block")}>
                    Worker Phone Number
                  </label>
                  <input
                    id="phone"
                    inputMode="tel"
                    placeholder="+2519… or 09…"
                    aria-invalid={!!errors.phone}
                    className={cn(CONTROL, "tabular")}
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p role="alert" className={ERROR_TEXT}>
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ratePerTaskEtb" className={cn(LABEL, "block")}>
                    Rate Per Task (ETB)
                  </label>
                  <input
                    id="ratePerTaskEtb"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="100"
                    aria-invalid={!!errors.ratePerTaskEtb}
                    className={cn(CONTROL, "tabular")}
                    {...register("ratePerTaskEtb", { valueAsNumber: true })}
                  />
                  {errors.ratePerTaskEtb && (
                    <p role="alert" className={ERROR_TEXT}>
                      {errors.ratePerTaskEtb.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <Button type="button" variant="ghost" onClick={resetDialog} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Dispatching…" : "Issue Contract & Dispatch"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
