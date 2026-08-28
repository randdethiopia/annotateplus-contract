"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubmitWorkerContract } from "@/lib/api/worker";
import { ApiError } from "@/lib/api/client";
import type { WorkerSubmittedData } from "@/types/backend";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MIN_DIMENSION = 300;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function checkImageDimensions(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalWidth >= MIN_DIMENSION && img.naturalHeight >= MIN_DIMENSION);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

export interface SignFormProps {
  token: string;
  initialValues?: Partial<WorkerSubmittedData>;
  requireNewPhotos?: boolean;
  agreedToTerms: boolean;
}

export function SignForm({
  token,
  initialValues,
  requireNewPhotos = false,
  agreedToTerms,
}: SignFormProps) {
  const [fullNameEnglish, setFullNameEnglish] = useState("");
  const [fullNameAmharic, setFullNameAmharic] = useState("");
  const [residenceLocation, setResidenceLocation] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountHolderName, setBankAccountHolderName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [faydaFront, setFaydaFront] = useState<File | null>(null);
  const [faydaBack, setFaydaBack] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const { mutate: submit, isPending } = useSubmitWorkerContract(token);

  useEffect(() => {
    if (!initialValues) return;
    if (initialValues.fullNameEnglish) setFullNameEnglish(initialValues.fullNameEnglish);
    if (initialValues.fullNameAmharic) setFullNameAmharic(initialValues.fullNameAmharic);
    if (initialValues.residenceLocation) setResidenceLocation(initialValues.residenceLocation);
    if (initialValues.bankName) setBankName(initialValues.bankName);
    if (initialValues.bankAccountHolderName)
      setBankAccountHolderName(initialValues.bankAccountHolderName);
    if (initialValues.bankAccountNumber) setBankAccountNumber(initialValues.bankAccountNumber);
  }, [initialValues]);

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    fieldName: string
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WebP photo.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Photo must be 10MB or smaller.");
      event.target.value = "";
      return;
    }
    const bigEnough = await checkImageDimensions(file);
    if (!bigEnough) {
      toast.error("Photo is too small or unreadable — please retake it (min 300×300px).");
      event.target.value = "";
      return;
    }
    setFieldErrors((prev) => ({ ...prev, [fieldName]: "" }));
    setter(file);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!agreedToTerms) {
      toast.error("Please confirm you have read and agree to the agreement.");
      return;
    }
    if (!faydaFront || !faydaBack) {
      toast.error("Please attach both sides of your ID.");
      return;
    }

    submit(
      {
        fullNameEnglish,
        fullNameAmharic: fullNameAmharic || undefined,
        residenceLocation,
        bankName,
        bankAccountHolderName,
        bankAccountNumber,
        faydaFront,
        faydaBack,
      },
      {
        onSuccess: () => {
          toast.success("Submitted for review");
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            if (err.status === 429 && err.retryAfterSeconds) {
              setRetryAfter(err.retryAfterSeconds);
              toast.error(`Too many attempts — try again in ${err.retryAfterSeconds}s`);
              return;
            }
            if (err.code === "VALIDATION_ERROR" && err.details?.issues) {
              const issues = err.details.issues as { path: string; message: string }[];
              const next: Record<string, string> = {};
              issues.forEach((issue) => {
                next[issue.path] = issue.message;
              });
              setFieldErrors(next);
            }
            toast.error(err.message);
          } else {
            toast.error("Submission failed. Please try again.");
          }
        },
      }
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg md:p-8"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900">Your details</h2>
        <p className="text-sm text-slate-500">
          {requireNewPhotos
            ? "Update your information and re-upload clear photos of both sides of your Fayda ID."
            : "Confirm your information and attach both sides of your ID to sign."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullNameEnglish">Full name (English)</Label>
          <Input
            id="fullNameEnglish"
            value={fullNameEnglish}
            onChange={(e) => setFullNameEnglish(e.target.value)}
            required
            minLength={2}
          />
          {fieldErrors.fullNameEnglish && (
            <p className="text-xs text-red-500">{fieldErrors.fullNameEnglish}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fullNameAmharic">Full name (Amharic) — optional</Label>
          <Input
            id="fullNameAmharic"
            className="font-ethiopic"
            value={fullNameAmharic}
            onChange={(e) => setFullNameAmharic(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="residenceLocation">Current residence</Label>
          <Input
            id="residenceLocation"
            value={residenceLocation}
            onChange={(e) => setResidenceLocation(e.target.value)}
            required
            minLength={2}
            placeholder="e.g. Addis Ababa, Bole"
          />
          {fieldErrors.residenceLocation && (
            <p className="text-xs text-red-500">{fieldErrors.residenceLocation}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bankName">Bank name</Label>
          <Input
            id="bankName"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
            minLength={2}
            placeholder="e.g. Commercial Bank of Ethiopia"
          />
          {fieldErrors.bankName && <p className="text-xs text-red-500">{fieldErrors.bankName}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bankAccountHolderName">Account holder name</Label>
          <Input
            id="bankAccountHolderName"
            value={bankAccountHolderName}
            onChange={(e) => setBankAccountHolderName(e.target.value)}
            required
            minLength={2}
          />
          {fieldErrors.bankAccountHolderName && (
            <p className="text-xs text-red-500">{fieldErrors.bankAccountHolderName}</p>
          )}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bankAccountNumber">Bank account number</Label>
          <Input
            id="bankAccountNumber"
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
            required
            minLength={6}
            maxLength={34}
          />
          {fieldErrors.bankAccountNumber && (
            <p className="text-xs text-red-500">{fieldErrors.bankAccountNumber}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <IdImageField
          label="Fayda ID — front"
          onChange={(e) => handleImageChange(e, setFaydaFront, "faydaFront")}
        />
        <IdImageField
          label="Fayda ID — back"
          onChange={(e) => handleImageChange(e, setFaydaBack, "faydaBack")}
        />
      </div>

      {retryAfter && (
        <p className="text-sm text-amber-600">Please wait {retryAfter} seconds before trying again.</p>
      )}

      <Button type="submit" disabled={isPending || !agreedToTerms} className="w-full sm:w-auto">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Sign &amp; Submit
      </Button>
    </form>
  );
}

function IdImageField({
  label,
  onChange,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    }
    onChange(event);
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 hover:bg-slate-100">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={label} className="max-h-48 rounded object-contain" />
        ) : (
          <>
            <ImagePlus className="size-6" />
            <span>Tap to take a photo or choose from gallery</span>
          </>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={handleChange}
        />
      </label>
    </div>
  );
}
