"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/system/field";
import { IdPhotoField } from "@/components/system/id-photo-field";
import { useSubmitWorkerContract } from "@/lib/api/worker";
import { ApiError } from "@/lib/api/client";
import { BANK_OPTIONS, parseBankName, resolveBankName } from "@/lib/banks";
import {
  workerSubmitSchema,
  type WorkerSubmitInput,
} from "@/lib/validations/contract.schema";
import { scrollIntoViewRespectingMotion } from "@/lib/scroll-into-view";
import { cn } from "@/lib/utils";
import { SIGN_COPY } from "./copy";
import type { ValidationIssue, WorkerSubmittedData } from "@/types/backend";

export interface SignFormProps {
  token: string;
  initialValues?: Partial<WorkerSubmittedData>;
  requireNewPhotos?: boolean;
}

const CARD = "pt-8 border-t border-slate-200/80 space-y-5";

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
  "bankAccountHolderName",
  "bankAccountNumber",
  "agreedToTerms",
];

function SectionHeading({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description?: string;
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-base font-semibold tracking-tight text-slate-900">
        <span className="tabular mr-2 font-mono text-sm text-slate-400">{step}.</span>
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
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
    <div className="pt-2">
      <p
        className={cn(
          "font-signature truncate border-b border-slate-300 pb-1 text-3xl leading-tight",
          trimmed ? "text-slate-900" : "text-slate-400"
        )}
        aria-live="polite"
      >
        {trimmed || "Your name"}
      </p>
      <p className="mt-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
        {SIGN_COPY.signaturePreview}
      </p>
    </div>
  );
}

function SigningAs({ control }: { control: Control<WorkerSubmitInput> }) {
  const name = useWatch({ control, name: "fullNameEnglish" })?.trim();

  return (
    <div className="hidden min-w-0 sm:block">
      {name ? (
        <p className="flex min-w-0 items-baseline gap-2 text-xs text-slate-500">
          <span className="shrink-0">{SIGN_COPY.signingAs}</span>
          <span className="font-signature truncate text-2xl leading-none text-slate-900">
            {name}
          </span>
        </p>
      ) : (
        <p className="text-sm font-medium text-slate-900">{SIGN_COPY.notSignedYet}</p>
      )}
      <p className="mt-1 truncate text-xs text-slate-500">{SIGN_COPY.submitNote}</p>
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
      bankAccountHolderName: "",
      bankAccountNumber: "",
      agreedToTerms: false,
    },
  });

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
        bankName: bank || current.bankName,
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

    // Was `behavior: reduceMotion ? "auto" : "smooth"`, which did nothing:
    // <html> carries `scroll-smooth`, so "auto" resolves to the computed CSS
    // scroll-behavior and animated anyway. The helper uses "instant".
    scrollIntoViewRespectingMotion(target, { block: "center" });
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
        bankName: resolveBankName(values.bankName),
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
      className="space-y-8"
    >
      <section className={CARD}>
        <SectionHeading
          step={1}
          title={SIGN_COPY.yourDetails}
          description={
            requireNewPhotos
              ? "Check your information below, then re-upload clear photos of your Fayda ID."
              : "Enter your information exactly as it appears on your Fayda National ID."
          }
        />

        <div className="space-y-4">
          <Field
            id="fullNameEnglish"
            label={SIGN_COPY.fullNameEnglish}
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
            label={SIGN_COPY.fullNameAmharic}
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
            label={SIGN_COPY.residence}
            required
            hint={SIGN_COPY.residenceHint}
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
          title={SIGN_COPY.faydaId}
          description="Photograph both sides on a flat surface in good light. All four corners must be visible and the text readable."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="faydaFront"
            render={({ field }) => (
              <IdPhotoField
                id="faydaFront"
                label={SIGN_COPY.idFront}
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
                label={SIGN_COPY.idBack}
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
          title={SIGN_COPY.paymentDetails}
          description="We pay you into this account. Double-check the number — a wrong digit delays payment."
        />

        <div className="space-y-4">
          <Field
            id="bankName"
            label={SIGN_COPY.bankName}
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

          <Field
            id="bankAccountHolderName"
            label={SIGN_COPY.accountHolder}
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
            label={SIGN_COPY.accountNumber}
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
        <SectionHeading step={4} title={SIGN_COPY.declaration} />

        <div className="space-y-5">
          <Controller
            control={control}
            name="agreedToTerms"
            render={({ field }) => (
              <div id="field-agreedToTerms">
                <label
                  htmlFor="agreedToTerms"
                  className={cn(
                    "-mx-3 flex cursor-pointer items-start gap-3.5 rounded-lg p-3 transition-colors",
                    // Green on consent: the one moment in the flow that is an
                    // affirmation rather than an action.
                    field.value
                      ? "bg-[#69B34C]/5 ring-2 ring-[#69B34C]/30"
                      : "hover:bg-slate-100"
                  )}
                >
                  <Checkbox
                    id="agreedToTerms"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="mt-0.5"
                    aria-invalid={!!errors.agreedToTerms}
                  />
                  <span className="min-w-0 text-sm font-medium text-slate-900">
                    {SIGN_COPY.consent}
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
          className="border-l-2 border-amber-500 py-1 pl-4 text-sm font-medium text-amber-900"
        >
          Too many attempts. Please wait {retryAfter} seconds before trying again.
        </p>
      )}

      {/*
        Pinned action drawer. It stays a DOM descendant of <form>, so the native
        submit still works without a form="" association.
      */}
      <div
        data-fixed-bottom-bar
        className="bg-background fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 px-4 pt-3 pb-safe"
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-6">
          <SigningAs control={control} />
          <Button
            type="submit"
            disabled={isPending}
            className="group h-12 w-full shrink-0 rounded-lg px-6 text-sm font-semibold sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Submitting…
              </>
            ) : (
              <>
                {SIGN_COPY.submit}
                <ArrowRight
                  className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                  aria-hidden
                />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
