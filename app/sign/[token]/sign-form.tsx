"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { Landmark, Loader2, PenLine, ScrollText, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/system/field";
import { IdPhotoField } from "@/components/system/id-photo-field";
import { useSubmitWorkerContract } from "@/lib/api/worker";
import { ApiError } from "@/lib/api/client";
import { BANK_OPTIONS, OTHER_BANK, parseBankName, resolveBankName } from "@/lib/banks";
import {
  workerSubmitSchema,
  type WorkerSubmitInput,
} from "@/lib/validations/contract.schema";
import { cn } from "@/lib/utils";
import { SIGN_COPY } from "./copy";
import type { ValidationIssue, WorkerSubmittedData } from "@/types/backend";

export interface SignFormProps {
  token: string;
  initialValues?: Partial<WorkerSubmittedData>;
  requireNewPhotos?: boolean;
}

const CARD = "bg-card space-y-5 rounded-2xl p-5 shadow-xs";

/**
 * Submit order. The scroll-to-first-error handler walks this, so it must match
 * the visual order of the form or the page jumps backwards.
 */
const FIELD_ORDER: (keyof WorkerSubmitInput)[] = [
  "fullNameEnglish",
  "fullNameAmharic",
  "residenceLocation",
  "faydaFront",
  "faydaBack",
  "bankName",
  "bankNameOther",
  "bankAccountHolderName",
  "bankAccountNumber",
  "agreedToTerms",
];

function SectionHeading({
  step,
  icon: Icon,
  title,
  titleAmharic,
  description,
}: {
  step: number;
  icon: typeof UserRound;
  title: string;
  titleAmharic?: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="bg-action-soft text-action flex size-9 shrink-0 items-center justify-center rounded-xl"
        aria-hidden
      >
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
        <h2 className="text-foreground text-base font-semibold tracking-tight">
          <span className="text-muted-foreground mr-1.5 font-mono text-sm">{step}.</span>
          {title}
          {titleAmharic && (
            <span className="font-ethiopic text-muted-foreground ml-2 text-sm font-normal">
              {titleAmharic}
            </span>
          )}
        </h2>
        {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
      </div>
    </div>
  );
}

/**
 * Live signature. Isolated into its own component reading via `useWatch` so a
 * keystroke in the name field re-renders this line and nothing else — and
 * because `watch()` returns a function React Compiler cannot memoize.
 */
function SignaturePreview({ control }: { control: Control<WorkerSubmitInput> }) {
  const name = useWatch({ control, name: "fullNameEnglish" });
  const trimmed = name?.trim();

  return (
    <div className="bg-surface-subtle rounded-xl px-4 py-3">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
        {SIGN_COPY.signaturePreview.en}
      </p>
      <p
        className={cn(
          "font-signature mt-1 truncate text-3xl leading-tight",
          trimmed ? "text-foreground" : "text-muted-foreground/50"
        )}
        aria-live="polite"
      >
        {trimmed || "Your name"}
      </p>
    </div>
  );
}

export function SignForm({ token, initialValues, requireNewPhotos = false }: SignFormProps) {
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const { mutate: submit, isPending } = useSubmitWorkerContract(token);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<WorkerSubmitInput>({
    resolver: zodResolver(workerSubmitSchema),
    // Errors appear as each field is left rather than all at once on submit.
    mode: "onTouched",
    defaultValues: {
      fullNameEnglish: "",
      fullNameAmharic: "",
      residenceLocation: "",
      bankName: undefined,
      bankNameOther: "",
      bankAccountHolderName: "",
      bankAccountNumber: "",
      agreedToTerms: false,
    },
  });

  const selectedBank = useWatch({ control, name: "bankName" });

  // On a resubmission the backend returns what the candidate typed last time, so
  // they only need to replace the photos that were rejected. Consent is
  // deliberately NOT restored — it must be given again for the new submission.
  useEffect(() => {
    if (!initialValues) return;
    const bank = parseBankName(initialValues.bankName);
    reset(
      (current) => ({
        ...current,
        fullNameEnglish: initialValues.fullNameEnglish ?? current.fullNameEnglish,
        fullNameAmharic: initialValues.fullNameAmharic ?? current.fullNameAmharic,
        residenceLocation: initialValues.residenceLocation ?? current.residenceLocation,
        bankName: bank.bankName || current.bankName,
        bankNameOther: bank.bankNameOther || current.bankNameOther,
        bankAccountHolderName:
          initialValues.bankAccountHolderName ?? current.bankAccountHolderName,
        bankAccountNumber: initialValues.bankAccountNumber ?? current.bankAccountNumber,
        agreedToTerms: false,
      }),
      { keepDefaultValues: true }
    );
  }, [initialValues, reset]);

  /** Walk the form in visual order and bring the first problem into view. */
  function scrollToFirstError(formErrors: typeof errors) {
    const firstKey = FIELD_ORDER.find((key) => formErrors[key]);
    if (!firstKey) return;

    const target =
      document.getElementById(`field-${firstKey}`) ?? document.getElementById(firstKey);
    if (!target) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    target.querySelector<HTMLElement>("input, select, textarea, button")?.focus({
      preventScroll: true,
    });
  }

  function onSubmit(values: WorkerSubmitInput) {
    setRetryAfter(null);

    submit(
      {
        fullNameEnglish: values.fullNameEnglish,
        fullNameAmharic: values.fullNameAmharic,
        residenceLocation: values.residenceLocation,
        bankName: resolveBankName(values.bankName, values.bankNameOther),
        bankAccountHolderName: values.bankAccountHolderName,
        bankAccountNumber: values.bankAccountNumber,
        faydaFront: values.faydaFront,
        faydaBack: values.faydaBack,
      },
      {
        onSuccess: () => toast.success("Submitted for review"),
        onError: (err) => {
          if (!(err instanceof ApiError)) {
            toast.error("Submission failed. Please try again.");
            return;
          }
          if (err.status === 429 && err.retryAfterSeconds) {
            setRetryAfter(err.retryAfterSeconds);
            toast.error(`Too many attempts — try again in ${err.retryAfterSeconds}s`);
            return;
          }
          if (err.code === "VALIDATION_ERROR" && err.details?.issues) {
            const issues = err.details.issues as ValidationIssue[];
            issues.forEach((issue) => {
              setError(issue.path as keyof WorkerSubmitInput, {
                type: "server",
                message: issue.message,
              });
            });
          }
          toast.error(err.message);
        },
      }
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, scrollToFirstError)}
      noValidate
      className="space-y-5"
    >
      <section className={CARD}>
        <SectionHeading
          step={1}
          icon={UserRound}
          title={SIGN_COPY.yourDetails.en}
          titleAmharic={SIGN_COPY.yourDetails.am}
          description={
            requireNewPhotos
              ? "Check your information below, then re-upload clear photos of your Fayda ID."
              : "Enter your information exactly as it appears on your Fayda National ID."
          }
        />

        <div className="space-y-4">
          <Field
            id="fullNameEnglish"
            label={SIGN_COPY.fullNameEnglish.en}
            required
            error={errors.fullNameEnglish?.message}
          >
            <Input
              id="fullNameEnglish"
              autoComplete="name"
              autoCapitalize="words"
              aria-invalid={!!errors.fullNameEnglish}
              {...register("fullNameEnglish")}
            />
          </Field>

          <Field
            id="fullNameAmharic"
            label={SIGN_COPY.fullNameAmharic.en}
            labelAmharic={SIGN_COPY.fullNameAmharic.am}
            required
            error={errors.fullNameAmharic?.message}
          >
            <Input
              id="fullNameAmharic"
              className="font-ethiopic"
              aria-invalid={!!errors.fullNameAmharic}
              {...register("fullNameAmharic")}
            />
          </Field>

          <Field
            id="residenceLocation"
            label={SIGN_COPY.residence.en}
            labelAmharic={SIGN_COPY.residence.am}
            required
            hint={SIGN_COPY.residenceHint.en}
            error={errors.residenceLocation?.message}
          >
            <Input
              id="residenceLocation"
              placeholder="e.g. Addis Ababa, Yeka Sub-City, Woreda 05"
              aria-invalid={!!errors.residenceLocation}
              {...register("residenceLocation")}
            />
          </Field>
        </div>
      </section>

      <section className={CARD}>
        <SectionHeading
          step={2}
          icon={ShieldCheck}
          title={SIGN_COPY.faydaId.en}
          titleAmharic={SIGN_COPY.faydaId.am}
          description="Photograph both sides on a flat surface in good light. All four corners must be visible and the text readable."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="faydaFront"
            render={({ field }) => (
              <IdPhotoField
                id="faydaFront"
                label={SIGN_COPY.idFront.en}
                labelAmharic={SIGN_COPY.idFront.am}
                value={field.value ?? null}
                onChange={field.onChange}
                error={errors.faydaFront?.message}
                disabled={isPending}
              />
            )}
          />
          <Controller
            control={control}
            name="faydaBack"
            render={({ field }) => (
              <IdPhotoField
                id="faydaBack"
                label={SIGN_COPY.idBack.en}
                labelAmharic={SIGN_COPY.idBack.am}
                value={field.value ?? null}
                onChange={field.onChange}
                error={errors.faydaBack?.message}
                disabled={isPending}
              />
            )}
          />
        </div>
      </section>

      <section className={CARD}>
        <SectionHeading
          step={3}
          icon={Landmark}
          title={SIGN_COPY.paymentDetails.en}
          titleAmharic={SIGN_COPY.paymentDetails.am}
          description="We pay you into this account. Double-check the number — a wrong digit delays payment."
        />

        <div className="space-y-4">
          <Field
            id="bankName"
            label={SIGN_COPY.bankName.en}
            labelAmharic={SIGN_COPY.bankName.am}
            required
            error={errors.bankName?.message}
          >
            {/* Native select: on a phone this opens the OS picker, which beats any
                custom listbox for reachability and works without JS hydration. */}
            <select
              id="bankName"
              aria-invalid={!!errors.bankName}
              className="bg-muted text-foreground focus-visible:ring-ring/40 focus-visible:bg-card h-12 w-full rounded-xl border-0 px-4 text-base outline-none focus-visible:ring-[3px] md:text-sm"
              defaultValue=""
              {...register("bankName")}
            >
              <option value="" disabled>
                Select your bank…
              </option>
              {BANK_OPTIONS.map((bank) => (
                <option key={bank.value} value={bank.value}>
                  {bank.label}
                </option>
              ))}
            </select>
          </Field>

          {selectedBank === OTHER_BANK && (
            <Field
              id="bankNameOther"
              label={SIGN_COPY.bankNameOther.en}
              labelAmharic={SIGN_COPY.bankNameOther.am}
              required
              error={errors.bankNameOther?.message}
            >
              <Input
                id="bankNameOther"
                placeholder="Type your bank's full name"
                aria-invalid={!!errors.bankNameOther}
                {...register("bankNameOther")}
              />
            </Field>
          )}

          <Field
            id="bankAccountHolderName"
            label={SIGN_COPY.accountHolder.en}
            labelAmharic={SIGN_COPY.accountHolder.am}
            required
            error={errors.bankAccountHolderName?.message}
          >
            <Input
              id="bankAccountHolderName"
              autoCapitalize="words"
              aria-invalid={!!errors.bankAccountHolderName}
              {...register("bankAccountHolderName")}
            />
          </Field>

          <Field
            id="bankAccountNumber"
            label={SIGN_COPY.accountNumber.en}
            labelAmharic={SIGN_COPY.accountNumber.am}
            required
            error={errors.bankAccountNumber?.message}
            hint="Digits only, exactly as printed on your passbook or bank app."
          >
            <Input
              id="bankAccountNumber"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              maxLength={20}
              className="tabular font-mono tracking-wide"
              aria-invalid={!!errors.bankAccountNumber}
              {...register("bankAccountNumber")}
            />
          </Field>
        </div>
      </section>

      <section className={CARD}>
        <SectionHeading
          step={4}
          icon={PenLine}
          title={SIGN_COPY.declaration.en}
          titleAmharic={SIGN_COPY.declaration.am}
        />

        <div className="space-y-3">
          <Controller
            control={control}
            name="agreedToTerms"
            render={({ field }) => (
              <div id="field-agreedToTerms">
                <label
                  htmlFor="agreedToTerms"
                  className={cn(
                    "flex cursor-pointer items-start gap-3.5 rounded-xl p-3.5 transition-colors",
                    // Green on consent: the one moment in the flow that is an
                    // affirmation rather than an action.
                    field.value
                      ? "bg-[#69B34C]/5 ring-2 ring-[#69B34C]/30"
                      : "bg-surface-subtle hover:bg-muted"
                  )}
                >
                  <Checkbox
                    id="agreedToTerms"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="mt-0.5"
                    aria-invalid={!!errors.agreedToTerms}
                  />
                  <span className="min-w-0">
                    <span className="text-foreground block text-sm font-medium">
                      {SIGN_COPY.consent.en}
                    </span>
                    <span className="font-ethiopic text-muted-foreground mt-1 block text-sm">
                      {SIGN_COPY.consent.am}
                    </span>
                  </span>
                </label>
                {errors.agreedToTerms && (
                  <p role="alert" className="text-destructive mt-1.5 text-xs font-medium">
                    {errors.agreedToTerms.message}
                  </p>
                )}
              </div>
            )}
          />

          <SignaturePreview control={control} />
        </div>
      </section>

      {retryAfter && (
        <p
          role="alert"
          className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
        >
          Too many attempts. Please wait {retryAfter} seconds before trying again.
        </p>
      )}

      {/*
        Pinned action drawer. It stays a DOM descendant of <form>, so the native
        submit still works without a form="" association.
      */}
      <div className="bg-card/95 border-border fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 pb-safe backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          <Button type="submit" size="xl" disabled={isPending} className="w-full font-bold">
            {isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ScrollText className="size-5" />
            )}
            {isPending ? "Submitting…" : SIGN_COPY.submit.en}
          </Button>
        </div>
      </div>
    </form>
  );
}
