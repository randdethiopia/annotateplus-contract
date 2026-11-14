"use client";

import { useEffect, useRef, type ReactNode, type Ref } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Link2Off,
  Loader2,
  RotateCw,
  ShieldCheck,
  TimerOff,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/branding/brand-logo";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { PasswordInput } from "@/components/auth/password-input";
import { Field } from "@/components/system/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { activateStaffAccount, getActivationPreview } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/client";
import { roleLabel } from "@/lib/auth/roles";
import { describeError } from "@/lib/describe-error";
import { formatSignedDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import {
  activateAccountSchema,
  type ActivateAccountInput,
} from "@/lib/validations/password.schema";
import type { ActivateAccountResponseData, ActivationPreviewDto } from "@/types/backend";

type DeadLinkKind = "invalid" | "expired" | "used" | "deactivated";

const DEAD_LINK_STATUSES = new Set([403, 404, 410]);

const ALERT_TONE = {
  destructive: {
    alert: "border-red-200 bg-destructive-soft text-red-900 [&>svg]:text-destructive",
    description: "text-red-800",
  },
  amber: {
    alert: "border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600",
    description: "text-amber-800",
  },
  slate: {
    alert: "border-slate-200 bg-slate-50 text-slate-900 [&>svg]:text-slate-500",
    description: "text-slate-600",
  },
} as const;

const DEAD_LINK_COPY: Record<
  DeadLinkKind,
  {
    heading: string;
    lead: string;
    alertTitle: string;
    alertBody: string;
    icon: LucideIcon;
    tone: keyof typeof ALERT_TONE;
  }
> = {
  invalid: {
    heading: "Link not recognised",
    lead: "We could not match this link to a pending staff invitation.",
    alertTitle: "This activation link is not valid",
    alertBody:
      "It may be incomplete or mistyped. Open the link again from your invitation email, or ask an administrator to send a new invitation.",
    icon: Link2Off,
    tone: "destructive",
  },
  expired: {
    heading: "Invitation expired",
    lead: "Activation links are time-limited to protect your account.",
    alertTitle: "This link is past its 48-hour window",
    alertBody:
      "Activation links expire 48 hours after they are sent. Ask an administrator to send you a new invitation.",
    icon: TimerOff,
    tone: "amber",
  },
  used: {
    heading: "Already activated",
    lead: "A password has already been set for this staff account.",
    alertTitle: "This link has already been used",
    alertBody:
      "Sign in with your email address and the password you chose. If you did not activate this account yourself, contact an administrator immediately.",
    icon: ShieldCheck,
    tone: "slate",
  },
  deactivated: {
    heading: "Account deactivated",
    lead: "This invitation can no longer be completed.",
    alertTitle: "This staff account is no longer active",
    alertBody:
      "Access for this account has been withdrawn, so it cannot be activated. Contact an administrator if you believe this is a mistake.",
    icon: Ban,
    tone: "destructive",
  },
};

const ASSURANCES = [
  {
    title: "Private, self-owned credential",
    body: "No administrator creates or sees your password. You choose it here, and only you know it.",
  },
  {
    title: "Single-use, 48-hour link",
    body: "This invitation stops working as soon as your password is set, or 48 hours after it was sent.",
  },
  {
    title: "Encrypted staff session",
    body: "Signing in issues a session over an encrypted connection, scoped to the browser tab you sign in from.",
  },
] as const;

function readDeadLink(err: unknown): DeadLinkKind | null {
  if (!(err instanceof ApiError) || !DEAD_LINK_STATUSES.has(err.status)) return null;
  const code = err.code.toUpperCase();
  if (err.status === 403 || code.includes("DEACTIVATED")) return "deactivated";
  if (code.includes("USED") || code.includes("ALREADY")) return "used";
  if (err.status === 410 || code.includes("EXPIRED")) return "expired";
  return "invalid";
}

function describeActivationError(err: unknown): string {
  if (err instanceof ApiError && err.status === 429) {
    return err.retryAfterSeconds
      ? `Too many attempts. Try again in ${err.retryAfterSeconds} seconds.`
      : "Too many attempts. Wait a moment and try again.";
  }
  return describeError(err, "Activation could not be completed");
}

function AssuranceList({ className }: { className?: string }) {
  return (
    <ol className={cn("divide-y divide-slate-200 border-y border-slate-200", className)}>
      {ASSURANCES.map((assurance, index) => (
        <li key={assurance.title} className="flex gap-4 py-4">
          <span className="pt-0.5 font-mono text-xs text-slate-400 tabular" aria-hidden>
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="text-foreground text-sm font-semibold">{assurance.title}</p>
            <p className="text-muted-foreground mt-1 text-sm text-pretty">{assurance.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function HelpLine({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-slate-500", className)}>
      Problems with this link? Contact your R&amp;D Group administrator.
    </p>
  );
}

function StateHeading({
  title,
  description,
  headingRef,
}: {
  title: string;
  description: string;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div>
      <h2
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className="text-foreground text-xl font-bold tracking-tight text-balance outline-none"
      >
        {title}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm text-pretty">{description}</p>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-muted-foreground shrink-0 text-sm">{label}</dt>
      <dd className="text-foreground min-w-0 truncate text-right text-sm font-medium">
        {children}
      </dd>
    </div>
  );
}

function IdentitySummary({
  heading,
  fullName,
  emailMasked,
  role,
  expiresAt,
}: Partial<ActivationPreviewDto> & { heading: string; emailMasked: string }) {
  return (
    <section aria-labelledby="invite-summary-heading">
      <h3
        id="invite-summary-heading"
        className="text-muted-foreground text-[11px] font-semibold tracking-[0.1em] uppercase"
      >
        {heading}
      </h3>
      <dl className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
        {fullName && <SummaryRow label="Name">{fullName}</SummaryRow>}
        <SummaryRow label="Email">{emailMasked}</SummaryRow>
        {role && (
          <SummaryRow label="Role">
            <Badge variant="secondary">{roleLabel(role)}</Badge>
          </SummaryRow>
        )}
        {expiresAt && (
          <SummaryRow label="Link expires">
            <span className="tabular">{formatSignedDateTime(expiresAt)}</span>
          </SummaryRow>
        )}
      </dl>
    </section>
  );
}

function PreviewSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        Checking your invitation
      </span>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      <Skeleton className="mt-8 h-3 w-28" />
      <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
        {["w-32", "w-40", "w-24", "w-44"].map((width) => (
          <div key={width} className="flex items-center justify-between gap-4 py-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className={cn("h-4 max-w-[60%]", width)} />
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-5">
        {[0, 1].map((slot) => (
          <div key={slot} className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

function DeadLinkState({ kind }: { kind: DeadLinkKind }) {
  const copy = DEAD_LINK_COPY[kind];
  const tone = ALERT_TONE[copy.tone];
  const Icon = copy.icon;

  return (
    <div className="space-y-8">
      <StateHeading title={copy.heading} description={copy.lead} />
      <Alert className={tone.alert}>
        <Icon aria-hidden />
        <AlertTitle className="line-clamp-none">{copy.alertTitle}</AlertTitle>
        <AlertDescription className={tone.description}>{copy.alertBody}</AlertDescription>
      </Alert>
      <Button asChild size="lg" variant={kind === "used" ? "default" : "outline"} className="w-full">
        <Link href="/login">
          {kind === "used" ? "Go to Sign In" : "Back to Sign In"}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

function UnavailableState({
  message,
  isRetrying,
  onRetry,
}: {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-8">
      <StateHeading
        title="We could not check this link"
        description="Your invitation may still be valid. This is usually a temporary connection problem."
      />
      <Alert className={ALERT_TONE.slate.alert}>
        <TriangleAlert aria-hidden />
        <AlertTitle className="line-clamp-none">Invitation check failed</AlertTitle>
        <AlertDescription className={ALERT_TONE.slate.description}>{message}</AlertDescription>
      </Alert>
      <div className="flex flex-col gap-3">
        <Button type="button" size="lg" className="w-full" onClick={onRetry} disabled={isRetrying}>
          <RotateCw className={cn(isRetrying && "animate-spin motion-reduce:animate-none")} aria-hidden />
          {isRetrying ? "Checking…" : "Try again"}
        </Button>
        <Button asChild variant="link" className="self-center">
          <Link href="/login">Go to Sign In</Link>
        </Button>
      </div>
    </div>
  );
}

function ActivationForm({
  preview,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  preview: ActivationPreviewDto;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (password: string) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ActivateAccountInput>({
    resolver: zodResolver(activateAccountSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const password = useWatch({ control, name: "password" });
  const confirmPassword = useWatch({ control, name: "confirmPassword" });

  return (
    <div className="space-y-8">
      <StateHeading
        title="Set your password"
        description="Choose the password you will use to sign in to AnnotatePlus Contract."
      />
      <IdentitySummary heading="Staff invitation" {...preview} />
      <form
        onSubmit={handleSubmit((values) => onSubmit(values.password))}
        noValidate
        className="space-y-6"
      >
        <fieldset disabled={isSubmitting} className="min-w-0 space-y-5">
          <legend className="sr-only">Choose your password</legend>
          <Field id="new-password" label="New password" error={errors.password?.message}>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              autoFocus
              aria-invalid={!!errors.password}
              aria-describedby="new-password-requirements"
              {...register("password")}
            />
          </Field>
          <PasswordChecklist
            id="new-password-requirements"
            password={password}
            confirmPassword={confirmPassword}
          />
          <Field
            id="confirm-password"
            label="Confirm password"
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
          </Field>
        </fieldset>

        {submitError && (
          <Alert className={ALERT_TONE.destructive.alert}>
            <TriangleAlert aria-hidden />
            <AlertTitle className="line-clamp-none">Activation failed</AlertTitle>
            <AlertDescription className={ALERT_TONE.destructive.description}>
              {submitError}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />}
          {isSubmitting ? "Activating…" : "Activate Account & Set Password"}
        </Button>
      </form>
    </div>
  );
}

function ActivatedState({
  preview,
  result,
}: {
  preview: ActivationPreviewDto | undefined;
  result: ActivateAccountResponseData;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <span
          className="mb-5 flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
          aria-hidden
        >
          <CheckCircle2 className="size-6" />
        </span>
        <StateHeading
          headingRef={headingRef}
          title="Account activated"
          description="Your password is set and this activation link is now closed. Sign in with your email address and the password you just chose."
        />
      </div>
      <IdentitySummary
        heading="Activated account"
        fullName={preview?.fullName}
        role={preview?.role}
        emailMasked={result.emailMasked}
      />
      <Button asChild size="lg" className="w-full">
        <Link href="/login">
          Continue to Sign In
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

export function ActivateAccountClient({ token }: { token: string }) {
  const preview = useQuery({
    queryKey: ["staff-activation", token],
    queryFn: () => getActivationPreview(token),
    enabled: !!token,
    retry: 0,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const activation = useMutation({
    retry: 0,
    mutationFn: async (password: string) => {
      const result = await activateStaffAccount({ token, password });
      if (!result.activated) {
        throw new Error("the server did not confirm the activation");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Account activated. You can now sign in with your new password.");
    },
  });

  const deadLink = readDeadLink(preview.error) ?? readDeadLink(activation.error);

  let body: ReactNode;
  if (activation.isSuccess) {
    body = <ActivatedState preview={preview.data} result={activation.data} />;
  } else if (preview.isPending) {
    body = <PreviewSkeleton />;
  } else if (deadLink) {
    body = <DeadLinkState kind={deadLink} />;
  } else if (preview.isError) {
    body = (
      <UnavailableState
        message={describeError(preview.error, "Check your connection and try again")}
        isRetrying={preview.isFetching}
        onRetry={() => void preview.refetch()}
      />
    );
  } else {
    body = (
      <ActivationForm
        preview={preview.data}
        isSubmitting={activation.isPending}
        submitError={activation.isError ? describeActivationError(activation.error) : null}
        onSubmit={(password) => activation.mutate(password)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-12">
      <aside className="border-b border-slate-200 bg-slate-50 lg:col-span-5 lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-8 px-4 py-8 sm:px-8 lg:sticky lg:top-0 lg:h-screen lg:gap-12 lg:overflow-y-auto lg:px-12 lg:py-12">
          <BrandLogo size="md" className="self-start" />
          <div className="border-gold border-l-[3px] pl-4">
            <p className="text-action text-[11px] font-semibold tracking-[0.14em] uppercase">
              AnnotatePlus Contract
            </p>
            <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight text-balance">
              Activate your staff account
            </h1>
            <p className="text-muted-foreground mt-1 text-sm text-pretty">
              One-time setup for invited R&amp;D Group staff.
            </p>
          </div>
          <AssuranceList className="hidden lg:block" />
          <HelpLine className="mt-auto hidden lg:block" />
        </div>
      </aside>

      <main className="flex lg:col-span-7">
        <div className="flex flex-1 justify-center px-4 py-10 sm:px-8 lg:items-center lg:py-16">
          <div className="w-full max-w-md">
            {body}
            <div className="mt-12 space-y-6 lg:hidden">
              <AssuranceList />
              <HelpLine />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
