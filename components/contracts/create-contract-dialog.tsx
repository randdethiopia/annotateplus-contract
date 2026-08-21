"use client";

import { useRef, useState, type FormEvent } from "react";
import { Check, Copy, Loader2, Plus } from "lucide-react";
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
import { ContractDocument } from "@/components/contracts/contract-document";
import { useAuth } from "@/lib/auth/auth-context";
import { useCreateContract } from "@/lib/api/finance";
import { normalizePhoneToLocal } from "@/lib/phone";
import { renderElementToPdfBlob } from "@/lib/pdf/render-to-blob";
import { ApiError } from "@/lib/backend/client";
import { describeError } from "@/lib/describe-error";
import type { CreateContractResponseData } from "@/types/backend";

const DEFAULT_CONTRACT_NUMBER = "R&D/EOC/InnC/0001/26";

export function CreateContractDialog() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [contractNumber, setContractNumber] = useState(DEFAULT_CONTRACT_NUMBER);
  const [ratePerTaskEtb, setRatePerTaskEtb] = useState("100");
  const [expiresInHours, setExpiresInHours] = useState("168");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<CreateContractResponseData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  const { mutate: createContract, isPending, error } = useCreateContract(token ?? "");

  function resetAndClose() {
    setOpen(false);
    setPhone("");
    setContractNumber(DEFAULT_CONTRACT_NUMBER);
    setRatePerTaskEtb("100");
    setExpiresInHours("168");
    setShowAdvanced(false);
    setResult(null);
    setCopied(false);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!contractNumber.trim()) {
      setFormError("Contract number is required — it's printed on the agreement sent to the worker.");
      return;
    }
    if (!documentRef.current) return;

    setIsGeneratingPdf(true);
    let contractPdf: File;
    try {
      const blob = await renderElementToPdfBlob(documentRef.current);
      if (blob.size > 10 * 1024 * 1024) {
        setIsGeneratingPdf(false);
        toast.error("The generated PDF is too large (over 10MB). Please try again.");
        return;
      }
      contractPdf = new File([blob], `${contractNumber.trim().replace(/\W+/g, "_")}.pdf`, {
        type: "application/pdf",
      });
    } catch (err) {
      console.error("Contract PDF generation failed", err);
      setIsGeneratingPdf(false);
      toast.error(describeError(err, "Could not generate the contract PDF"));
      return;
    }
    setIsGeneratingPdf(false);

    createContract(
      {
        phone: normalizePhoneToLocal(phone),
        contractPdf,
        contractNumber: contractNumber.trim(),
        ratePerTaskEtb: Number(ratePerTaskEtb) || undefined,
        expiresInHours: Number(expiresInHours) || undefined,
      },
      {
        onSuccess: (data) => setResult(data),
        onError: (err) => {
          console.error("Create contract failed", err);
          toast.error(describeError(err, "Could not create contract"));
        },
      }
    );
  }

  const inviteLink =
    result && typeof window !== "undefined"
      ? `${window.location.origin}${result.inviteLink}`
      : "";

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied");
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="size-4" />
          New Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Contract created — {result.contractNumber}</DialogTitle>
              <DialogDescription>
                This link is shown <strong>once</strong> and cannot be retrieved again. Copy it now
                and send it to the worker.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-2 text-sm">
              <span className="flex-1 truncate">{inviteLink}</span>
              <Button type="button" size="icon" variant="ghost" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={resetAndClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>New Contract</DialogTitle>
              <DialogDescription>
                The standard R&amp;D worker agreement is generated automatically — just enter the
                worker&apos;s phone number and the contract number.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxx or +2519xxxxxxxx"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contractNumber">Contract number</Label>
                <Input
                  id="contractNumber"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="e.g. R&D/EOC/InnC/0001/26"
                  required
                />
              </div>
              <button
                type="button"
                className="text-sm text-[#3651a2] underline underline-offset-2"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? "Hide" : "Show"} advanced options
              </button>
              {showAdvanced && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="rate">Rate per task (ETB)</Label>
                    <Input
                      id="rate"
                      type="number"
                      min={0}
                      value={ratePerTaskEtb}
                      onChange={(e) => setRatePerTaskEtb(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expires">Expires in (hours)</Label>
                    <Input
                      id="expires"
                      type="number"
                      min={1}
                      max={8760}
                      value={expiresInHours}
                      onChange={(e) => setExpiresInHours(e.target.value)}
                    />
                  </div>
                </div>
              )}
              {(formError || error) && (
                <p className="text-sm text-red-500">
                  {formError ?? (error instanceof ApiError ? error.message : "Something went wrong")}
                </p>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={isPending || isGeneratingPdf}>
                {(isPending || isGeneratingPdf) && <Loader2 className="size-4 animate-spin" />}
                {isGeneratingPdf ? "Generating PDF…" : "Create & Send"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>

      {/* Off-screen render target used only to capture the standard agreement as a PDF. */}
      <div className="pointer-events-none fixed top-0 -left-[9999px] w-[896px]" aria-hidden>
        <ContractDocument
          ref={documentRef}
          contractNumber={contractNumber.trim() || "________________________"}
          workerName="________________________"
          signed={false}
        />
      </div>
    </Dialog>
  );
}
