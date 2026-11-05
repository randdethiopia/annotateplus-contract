"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  useFormState,
  useWatch,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/system/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { candidatesApi } from "@/lib/api/candidates.api";
import { describeError } from "@/lib/describe-error";
import {
  ETHIOPIAN_REGIONS,
  GENDER_OPTIONS,
  MAX_APPLICANT_AGE,
  MIN_APPLICANT_AGE,
  TRAINING_OPTIONS,
  VULNERABILITY_OPTIONS,
} from "@/lib/ethiopia";
import { normalizePhoneToE164, normalizePhoneToLocal } from "@/lib/phone";
import { scrollIntoViewRespectingMotion } from "@/lib/scroll-into-view";
import { cn } from "@/lib/utils";
import {
  AGE_INTEGER_MESSAGE,
  AGE_RANGE_MESSAGE,
  candidateApplySchema,
  type CandidateApplyInput,
} from "@/lib/validations/candidate.schema";
import { ApplicationReceipt, type SubmittedApplication } from "./application-receipt";
import { CARD_SURFACE, CONTROL, CONTROL_INVALID } from "./apply-controls";
import { ChoiceField } from "./choice-field";
import { Stepper } from "./stepper";
import type { PublicCandidateApplyDto, ValidationIssue } from "@/types/backend";

const ALERT_ID = "apply-submit-alert";
const FORM_ID = "apply-form-card";

const STEPS = [
  {
    title: "Basic Information",
    description: "Enter your official legal name and contact phone number.",
    fields: ["firstName", "fatherName", "grandfatherName", "phone", "email"],
  },
  {
    title: "Demographics & Location",
    description: "Help us verify your eligibility and project region.",
    fields: ["gender", "age", "region"],
  },
  {
    title: "Background & Availability",
    description: "Final details before submitting your application.",
    fields: ["vulnerabilityStatus", "willingToAttendTraining"],
  },
] satisfies readonly {
  title: string;
  description: string;
  fields: (keyof CandidateApplyInput)[];
}[];

const ACTIVE_CONTRACT_MESSAGE =
  "This phone number is already registered under an active contract with R&D Group. Please contact your project coordinator.";
const DUPLICATE_APPLICATION_MESSAGE =
  "An application has already been received for this phone number.";
const NETWORK_FAILURE_MESSAGE =
  "We could not reach the server. Check your internet connection and try again.";

const PRIMARY_BUTTON =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-medium text-white shadow-sm transition-all duration-100 hover:bg-slate-800 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
const GHOST_BUTTON =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-slate-600 transition-all duration-100 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none";

const SELECT_TRIGGER =
  "w-full justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-xs transition-all data-[size=default]:h-12 data-[placeholder]:text-slate-400 focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 aria-invalid:bg-white aria-invalid:ring-0";

const SELECT_CONTENT =
  "max-h-64 overflow-y-auto rounded-2xl border-slate-200/90 bg-white p-1.5 shadow-xl";

const SELECT_ITEM =
  "cursor-pointer rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-700 transition-colors focus:bg-slate-50 focus:text-slate-900";

interface SubmitAlert {
  kind: "conflict" | "recoverable" | "failure";
  message: string;
}

function toAge(value: unknown): number {
  if (typeof value === "number") return value;
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? Number.NaN : Number(trimmed);
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-pretty text-slate-500">{description}</p>
    </div>
  );
}

function AgeEligibility({ control }: { control: Control<CandidateApplyInput> }) {
  const age = useWatch({ control, name: "age" });
  const { errors } = useFormState({ control, name: "age" });

  const hasValue = Number.isFinite(age);
  const problem = !hasValue
    ? null
    : !Number.isInteger(age)
      ? AGE_INTEGER_MESSAGE
      : age < MIN_APPLICANT_AGE || age > MAX_APPLICANT_AGE
        ? AGE_RANGE_MESSAGE
        : null;

  return (
    <div className="min-h-5">
      {!hasValue && errors.age?.message && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {errors.age.message}
        </p>
      )}
      {hasValue && problem && (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-amber-700">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          {problem}
        </p>
      )}
      {hasValue && !problem && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <Check className="size-3.5 shrink-0" aria-hidden />
          Eligible ({MIN_APPLICANT_AGE}&ndash;{MAX_APPLICANT_AGE})
        </p>
      )}
    </div>
  );
}

function buildPayload(values: CandidateApplyInput, source: string): PublicCandidateApplyDto {
  return {
    firstName: values.firstName,
    fatherName: values.fatherName,
    grandfatherName: values.grandfatherName,
    phone: normalizePhoneToE164(values.phone),
    email: values.email?.trim() || undefined,
    gender: values.gender,
    age: values.age,
    region: values.region,
    vulnerabilityStatus: values.vulnerabilityStatus,
    willingToAttendTraining: values.willingToAttendTraining === "yes",
    source,
    website_hp: values.website_hp,
  };
}

export function ApplyForm({ source }: { source: string }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [submitted, setSubmitted] = useState<SubmittedApplication | null>(null);
  const [alert, setAlert] = useState<SubmitAlert | null>(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    reset,
    setError,
    formState: { errors },
  } = useForm<CandidateApplyInput>({
    resolver: zodResolver(candidateApplySchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      fatherName: "",
      grandfatherName: "",
      phone: "",
      email: "",
      vulnerabilityStatus: "NONE",
      website_hp: "",
    },
  });

  const { mutate: apply, isPending } = useMutation({
    mutationFn: candidatesApi.apply,
    retry: 0,
  });

  function scrollToCardTop() {
    requestAnimationFrame(() =>
      scrollIntoViewRespectingMotion(document.getElementById(FORM_ID), { block: "start" })
    );
  }

  function raiseAlert(next: SubmitAlert) {
    setAlert(next);
    requestAnimationFrame(() =>
      scrollIntoViewRespectingMotion(document.getElementById(ALERT_ID), { block: "center" })
    );
  }

  function focusFirstError(formErrors: FieldErrors<CandidateApplyInput>) {
    const keys = STEPS.flatMap((entry) => entry.fields);
    const firstKey = keys.find((key) => formErrors[key]);
    if (!firstKey) return;

    const target =
      document.getElementById(`field-${firstKey}`) ?? document.getElementById(firstKey);
    if (!target) return;

    scrollIntoViewRespectingMotion(target, { block: "center" });
    target
      .querySelector<HTMLElement>("input, select, textarea, [role=combobox]")
      ?.focus({ preventScroll: true });
  }

  async function goNext() {
    const valid = await trigger(STEPS[step].fields);
    if (!valid) return;
    setDirection("forward");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    scrollToCardTop();
  }

  function goBack() {
    setAlert(null);
    setDirection("backward");
    setStep((current) => Math.max(current - 1, 0));
    scrollToCardTop();
  }

  function onInvalid(formErrors: FieldErrors<CandidateApplyInput>) {
    const stepIndex = STEPS.findIndex((entry) => entry.fields.some((key) => formErrors[key]));
    if (stepIndex >= 0 && stepIndex !== step) {
      setDirection(stepIndex > step ? "forward" : "backward");
      setStep(stepIndex);
      scrollToCardTop();
      return;
    }
    focusFirstError(formErrors);
  }

  function onSubmit(values: CandidateApplyInput) {
    setAlert(null);

    apply(buildPayload(values, source), {
      onSuccess: () => {
        setSubmitted({
          firstName: values.firstName,
          fatherName: values.fatherName,
          fullName: `${values.firstName} ${values.fatherName} ${values.grandfatherName}`,
          phone: normalizePhoneToLocal(values.phone),
          region: values.region,
        });
      },
      onError: (err) => {
        if (!(err instanceof ApiError)) {
          raiseAlert({
            kind: "failure",
            message: describeError(err, "We could not submit your application"),
          });
          toast.error("Submission failed. Please try again.");
          return;
        }

        if (err.status === 0) {
          raiseAlert({ kind: "failure", message: NETWORK_FAILURE_MESSAGE });
          return;
        }

        if (err.status === 409) {
          raiseAlert({
            kind: "conflict",
            message: /active contract/i.test(err.message)
              ? ACTIVE_CONTRACT_MESSAGE
              : DUPLICATE_APPLICATION_MESSAGE,
          });
          return;
        }

        if (err.status === 429) {
          raiseAlert({
            kind: "recoverable",
            message: err.retryAfterSeconds
              ? `Too many attempts. Please wait ${err.retryAfterSeconds} seconds before trying again.`
              : "Too many attempts. Please wait a moment and try again.",
          });
          return;
        }

        if (err.code === "VALIDATION_ERROR" && err.details?.issues) {
          const issues = err.details.issues as ValidationIssue[];
          issues.forEach((issue) => {
            setError(issue.path as keyof CandidateApplyInput, {
              type: "server",
              message: issue.message,
            });
          });
        }

        raiseAlert({ kind: "failure", message: err.message });
        toast.error(err.message);
      },
    });
  }

  function handleReset() {
    setSubmitted(null);
    setAlert(null);
    setDirection("forward");
    setStep(0);
    reset();
  }

  if (submitted) {
    return <ApplicationReceipt application={submitted} onReset={handleReset} />;
  }

  const active = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  return (
    <form
      id={FORM_ID}
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
      className={cn(CARD_SURFACE, "relative mt-8 scroll-mt-6 p-6 sm:p-12")}
    >
      <Stepper current={step} />

      <div className="mt-8 space-y-6">
        <div
          key={step}
          className={cn(
            "space-y-6 duration-200 ease-out motion-safe:animate-in motion-safe:fade-in-50",
            direction === "forward"
              ? "motion-safe:slide-in-from-right-4"
              : "motion-safe:slide-in-from-left-4"
          )}
        >
          <SectionHeading title={active.title} description={active.description} />

          {step === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field id="firstName" label="First Name" required error={errors.firstName?.message}>
                  <input
                    id="firstName"
                    placeholder="Abebe"
                    autoComplete="given-name"
                    autoCapitalize="words"
                    aria-invalid={!!errors.firstName}
                    className={cn(CONTROL, errors.firstName && CONTROL_INVALID)}
                    {...register("firstName")}
                  />
                </Field>
                <Field
                  id="fatherName"
                  label="Father&apos;s Name"
                  required
                  error={errors.fatherName?.message}
                >
                  <input
                    id="fatherName"
                    placeholder="Bikila"
                    autoCapitalize="words"
                    aria-invalid={!!errors.fatherName}
                    className={cn(CONTROL, errors.fatherName && CONTROL_INVALID)}
                    {...register("fatherName")}
                  />
                </Field>
                <Field
                  id="grandfatherName"
                  label="Grandfather&apos;s Name"
                  required
                  error={errors.grandfatherName?.message}
                >
                  <input
                    id="grandfatherName"
                    placeholder="Demisse"
                    autoCapitalize="words"
                    aria-invalid={!!errors.grandfatherName}
                    className={cn(CONTROL, errors.grandfatherName && CONTROL_INVALID)}
                    {...register("grandfatherName")}
                  />
                </Field>
              </div>

              <Field
                id="phone"
                label="Phone Number"
                required
                error={errors.phone?.message}
                hint="Enter an active phone number. Contract invitations will be sent via SMS."
              >
                <div
                  className={cn(
                    "flex h-12 w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white pr-4 pl-2 shadow-xs transition-all",
                    "focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10",
                    errors.phone && "border-rose-300 focus-within:ring-rose-500/10"
                  )}
                >
                  <span
                    id="phone-prefix"
                    className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 select-none"
                  >
                    +251
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={13}
                    placeholder="911 234 567"
                    aria-invalid={!!errors.phone}
                    aria-describedby="phone-prefix"
                    className="tabular min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    {...register("phone", {
                      onChange: () =>
                        setAlert((current) => (current?.kind === "conflict" ? null : current)),
                    })}
                  />
                </div>
              </Field>

              <Field id="email" label="Email Address" optional error={errors.email?.message}>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="abebe@example.com"
                  aria-invalid={!!errors.email}
                  className={cn(CONTROL, errors.email && CONTROL_INVALID)}
                  {...register("email", { setValueAs: (value: string) => value.trim() })}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="gender" label="Gender" required error={errors.gender?.message}>
                  <ChoiceField
                    label="Gender"
                    options={GENDER_OPTIONS}
                    invalid={!!errors.gender}
                    registration={register("gender")}
                  />
                </Field>

                <Field id="age" label="Age" required>
                  <input
                    id="age"
                    type="number"
                    inputMode="numeric"
                    min={MIN_APPLICANT_AGE}
                    max={MAX_APPLICANT_AGE}
                    placeholder="24"
                    aria-invalid={!!errors.age}
                    className={cn(CONTROL, "tabular", errors.age && CONTROL_INVALID)}
                    {...register("age", { setValueAs: toAge })}
                  />
                  <AgeEligibility control={control} />
                </Field>
              </div>

              <Field
                id="region"
                label="Region or City Administration"
                required
                error={errors.region?.message}
              >
                <Controller
                  control={control}
                  name="region"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="region"
                        aria-invalid={!!errors.region}
                        className={cn(SELECT_TRIGGER, errors.region && "border-rose-300")}
                      >
                        <SelectValue placeholder="Select your region&hellip;" />
                      </SelectTrigger>
                      <SelectContent position="popper" align="start" className={SELECT_CONTENT}>
                        {ETHIOPIAN_REGIONS.map((region) => (
                          <SelectItem key={region} value={region} className={SELECT_ITEM}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <Field
                id="vulnerabilityStatus"
                label="Do you identify as any of the following?"
                required
                error={errors.vulnerabilityStatus?.message}
              >
                <ChoiceField
                  label="Do you identify as any of the following?"
                  layout="cards"
                  options={VULNERABILITY_OPTIONS}
                  invalid={!!errors.vulnerabilityStatus}
                  registration={register("vulnerabilityStatus")}
                />
              </Field>

              <Field
                id="willingToAttendTraining"
                label="Are you willing to attend training or assessment if required by R&amp;D?"
                required
                error={errors.willingToAttendTraining?.message}
              >
                <ChoiceField
                  label="Are you willing to attend training or assessment if required by R&D?"
                  options={TRAINING_OPTIONS}
                  invalid={!!errors.willingToAttendTraining}
                  registration={register("willingToAttendTraining")}
                />
              </Field>
            </div>
          )}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor="website_hp">Website</label>
          <input
            id="website_hp"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website_hp")}
          />
        </div>

        {alert && (
          <div
            id={ALERT_ID}
            role="alert"
            className={cn(
              "flex items-start gap-2.5 rounded-xl p-4 text-sm",
              alert.kind === "failure"
                ? "bg-rose-50 text-rose-900"
                : "bg-amber-50 text-amber-900"
            )}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="text-pretty">{alert.message}</p>
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-3 border-t border-slate-100 pt-6",
            step === 0 ? "justify-end" : "justify-between"
          )}
        >
          {step > 0 && (
            <button type="button" onClick={goBack} className={GHOST_BUTTON}>
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </button>
          )}

          {isLastStep ? (
            <button type="submit" disabled={isPending} className={cn(PRIMARY_BUTTON, "px-8")}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {isPending ? "Submitting…" : "Submit Application"}
              {!isPending && <ArrowRight className="size-4" aria-hidden />}
            </button>
          ) : (
            <button type="button" onClick={goNext} className={PRIMARY_BUTTON}>
              {step === 0 ? "Continue to Demographics" : "Continue to Background"}
              <ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
