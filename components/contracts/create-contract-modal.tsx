"use client";

import { useRef, useState, type DragEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCircle2, Copy, FileText, Loader2, Plus, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { useCreateContract } from "@/lib/hooks/use-finance";
import { describeError } from "@/lib/describe-error";
import {
  createContractSchema,
  type CreateContractFormInput,
} from "@/lib/validations/contract.schema";
import type { CreateContractResponseData } from "@/types/backend";

const DEFAULT_CONTRACT_NUMBER = "R&D/EOC/InnC/0001/26";

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

export function CreateContractModal() {
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
      contractPdf: undefined as unknown as File,
    },
  });

  const contractPdf = watch("contractPdf");

  function resetModal() {
    setOpen(false);
    reset({
      contractNumber: DEFAULT_CONTRACT_NUMBER,
      phone: "",
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
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else resetModal();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" className="bg-[#1A4428] hover:bg-[#13331e] text-white">
          <Plus className="size-4" />
          New Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Contract Created &amp; SMS Dispatched!</DialogTitle>
              <DialogDescription asChild>
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  <span>An automated invitation SMS has been dispatched to the worker&apos;s phone.</span>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-[#1A4428]">Backup Sharing Link (Optional)</p>
                <p className="text-sm text-muted-foreground">
                  You can also copy and share this link directly via Telegram, WhatsApp, or Email.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#F7F7F6] px-3 py-2 text-sm">
                <span className="flex-1 truncate">{inviteLink}</span>
                <Button type="button" size="icon" variant="ghost" onClick={handleCopy}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={resetModal}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>New Contract</DialogTitle>
              <DialogDescription>
                Upload the agreement PDF, enter the contract number, and the worker&apos;s phone
                number.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label id="contractPdf-label">Contract Agreement (PDF)</Label>
                <input
                  ref={fileInputRef}
                  id="contractPdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {contractPdf instanceof File && contractPdf.size > 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-[#F7F7F6] p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 size-5 shrink-0 text-[#69B34C]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1A4428]">
                          {contractPdf.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(contractPdf.size)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={clearPdf}>
                        Remove
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Replace
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="contractPdf"
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors hover:border-[#69B34C] ${
                      isDragging
                        ? "border-[#69B34C] bg-[#69B34C]/5"
                        : "border-slate-200 bg-[#F7F7F6]"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="size-6 text-slate-400" />
                    <span>Click or drag a PDF here</span>
                  </label>
                )}
                {errors.contractPdf && (
                  <p className="text-sm text-red-500">{errors.contractPdf.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contractNumber">Contract number</Label>
                <Input id="contractNumber" className="h-11" {...register("contractNumber")} />
                {errors.contractNumber && (
                  <p className="text-sm text-red-500">{errors.contractNumber.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  className="h-11"
                  placeholder="+251911223344 or 0911223344"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[#1A4428] hover:bg-[#13331e] text-white"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Create & Send
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
