"use client";

import { useState, type ReactNode } from "react";
import { AlertCircle, Clock, Loader2, Lock, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  OTP_MAX_ATTEMPTS,
  OTP_MAX_SENDS,
  OTP_TTL_MINUTES,
  readOtpFailure,
  useRequestApprovalOtp,
  useVerifyManagerOtp,
  type OtpFailure,
} from "@/lib/hooks/use-campaign-approval";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { cn } from "@/lib/utils";
import type { ApprovalViewDto } from "@/types/backend";
import { OTP_LENGTH, OtpInput, emptyOtp } from "./otp-input";

const CTA_CLASS =
  "h-auto min-h-12 w-full rounded-xl px-4 py-3 text-[15px] font-medium whitespace-normal";

const SECONDARY_CLASS =
  "h-auto min-h-11 w-full rounded-xl px-4 py-2.5 font-medium whitespace-normal tabular";

const SPINNER = <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />;

interface Notice {
  tone: "danger" | "neutral";
  title: string;
  description: string;
}

const TERMINAL_KINDS = new Set<OtpFailure["kind"]>(["deactivated", "link-expired", "email-missing"]);

const LOCKED_NOTICE: Notice = {
  tone: "danger",
  title: "Verification locked",
  description: `Verification is locked after ${OTP_MAX_ATTEMPTS} incorrect codes. Ask HR to re-submit the campaign for approval to issue a new link.`,
};

const LEGACY_NOTICE: Notice = {
  tone: "neutral",
  title: "New approval link required",
  description:
    "This approval request was issued before email verification and has no approver email on file. Ask HR to re-submit the campaign for approval to receive a new link by email.",
};

const EXHAUSTED_NOTICE: Notice = {
  tone: "danger",
  title: "Code expired",
  description:
    "This code has expired and no more codes can be sent for this link. Ask HR to re-submit the campaign for approval to issue a new link.",
};

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

function attemptsMessage(attemptsRemaining: number | undefined): string {
  if (attemptsRemaining === undefined) return "Incorrect code. Check your email and try again.";
  return `Incorrect code. ${attemptsRemaining} ${
    attemptsRemaining === 1 ? "attempt" : "attempts"
  } remaining.`;
}

function describeFailure(failure: OtpFailure): Notice | null {
  switch (failure.kind) {
    case "deactivated":
      return {
        tone: "danger",
        title: "Approver access deactivated",
        description:
          "Your executive approver access has been deactivated, so this campaign can no longer be authorized from this link. Contact HR.",
      };
    case "link-expired":
      return {
        tone: "danger",
        title: "Approval link expired",
        description:
          "This approval link has expired. Ask HR to re-submit the campaign for approval to receive a new link.",
      };
    case "email-missing":
      return {
        tone: "danger",
        title: "No approver email on file",
        description:
          "There is no email address to send a verification code to. Ask HR to re-submit the campaign for approval.",
      };
    case "cooldown":
      return {
        tone: "neutral",
        title: "A code was just sent",
        description: failure.retryAfterSeconds
          ? `Check your inbox. You can request another code in ${formatWait(failure.retryAfterSeconds)}.`
          : "Check your inbox. You can request another code in a minute.",
      };
    case "send-limit":
      return {
        tone: "danger",
        title: "Code limit reached",
        description: `The maximum of ${OTP_MAX_SENDS} verification codes has been sent for this link. Use the latest code, or ask HR to re-submit the campaign for a new link.`,
      };
    case "rate-limited":
      return {
        tone: "neutral",
        title: "Too many requests",
        description: failure.retryAfterSeconds
          ? `Too many requests from this device. Try again in ${formatWait(failure.retryAfterSeconds)}.`
          : "Too many requests from this device. Wait a few minutes and try again.",
      };
    case "delivery-failed":
      return {
        tone: "danger",
        title: "Email not delivered",
        description:
          "The verification email could not be delivered and no code was used up. Try again in a moment.",
      };
    case "not-requested":
      return {
        tone: "neutral",
        title: "No active code",
        description: "Send a verification code to your email to continue.",
      };
    case "other":
      return { tone: "danger", title: "Something went wrong", description: failure.message };
    default:
      return null;
  }
}

function NoticeAlert({ notice, icon }: { notice: Notice; icon?: ReactNode }) {
  const danger = notice.tone === "danger";
  return (
    <Alert
      role={danger ? "alert" : "status"}
      className={cn(
        danger
          ? "bg-destructive-soft [&>svg]:text-destructive border-red-200 text-red-900"
          : "border-slate-200 bg-slate-50 text-slate-900 [&>svg]:text-slate-500"
      )}
    >
      {icon ?? <AlertCircle aria-hidden />}
      <AlertTitle className="line-clamp-none">{notice.title}</AlertTitle>
      <AlertDescription className={cn("text-pretty", danger ? "text-red-800" : "text-slate-600")}>
        {notice.description}
      </AlertDescription>
    </Alert>
  );
}

function StepHeading({ step, title }: { step: 1 | 2; title: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="text-base font-semibold text-balance text-slate-900">{title}</h2>
      <Badge variant="outline" className="mt-0.5 text-slate-600 tabular">
        Step {step} of 2
      </Badge>
    </div>
  );
}

function MaskedContact({ value }: { value: string }) {
  return <span className="font-mono font-medium break-all text-slate-900 tabular">{value}</span>;
}

function StepMarker({ n }: { n: number }) {
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[11px] font-semibold text-slate-600 tabular"
      aria-hidden
    >
      {n}
    </span>
  );
}

function RequestStep({
  email,
  notice,
  isPending,
  onRequest,
}: {
  email: string;
  notice: Notice | null;
  isPending: boolean;
  onRequest: () => void;
}) {
  return (
    <div className="space-y-5">
      <StepHeading step={1} title="Verify your identity" />
      <ol className="space-y-3 text-sm text-pretty text-slate-600">
        <li className="flex gap-3">
          <StepMarker n={1} />
          <span className="min-w-0">
            Send a {OTP_LENGTH}-digit verification code to <MaskedContact value={email} />.
          </span>
        </li>
        <li className="flex gap-3">
          <StepMarker n={2} />
          <span className="min-w-0">
            Enter the code here within {OTP_TTL_MINUTES} minutes to authorize this disbursement.
            You have {OTP_MAX_ATTEMPTS} attempts.
          </span>
        </li>
      </ol>

      {notice && <NoticeAlert notice={notice} />}

      <Button type="button" onClick={onRequest} disabled={isPending} className={CTA_CLASS}>
        {isPending ? SPINNER : <Mail className="size-4" aria-hidden />}
        {isPending ? "Sending code…" : "Send Verification Code to My Email"}
      </Button>
    </div>
  );
}

function ResendControl({
  availableAt,
  sendsRemaining,
  isPending,
  disabled,
  prominent,
  onResend,
}: {
  availableAt: string | null;
  sendsRemaining: number | undefined;
  isPending: boolean;
  disabled: boolean;
  prominent: boolean;
  onResend: () => void;
}) {
  const cooldown = useCountdown(availableAt ?? undefined);
  const waiting = cooldown.isKnown && !cooldown.isExpired;
  const seconds = Math.ceil(cooldown.remainingMs / 1000);
  const exhausted = sendsRemaining === 0;

  let label = prominent ? "Send a New Code" : "Resend Code";
  if (isPending) label = "Sending code…";
  else if (waiting) label = `Resend Code in ${seconds}s`;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={prominent ? "default" : "outline"}
        onClick={onResend}
        disabled={disabled || isPending || waiting || exhausted}
        className={prominent ? CTA_CLASS : SECONDARY_CLASS}
      >
        {isPending ? SPINNER : <RefreshCw className="size-4" aria-hidden />}
        {label}
      </Button>
      {sendsRemaining !== undefined && (
        <p className="text-center text-xs text-slate-500 tabular">
          {exhausted
            ? "No more codes can be sent for this link."
            : `${sendsRemaining} ${sendsRemaining === 1 ? "resend" : "resends"} left`}
        </p>
      )}
    </div>
  );
}

function CodeStep({
  view,
  contact,
  notice,
  inlineError,
  isVerifying,
  isResending,
  autoFocus,
  resent,
  onVerify,
  onEdit,
  onResend,
}: {
  view: ApprovalViewDto;
  contact: string | null;
  notice: Notice | null;
  inlineError: string | null;
  isVerifying: boolean;
  isResending: boolean;
  autoFocus: boolean;
  resent: boolean;
  onVerify: (code: string, onRejected: () => void) => void;
  onEdit: () => void;
  onResend: () => void;
}) {
  const countdown = useCountdown(view.otpExpiresAt ?? undefined);
  const [digits, setDigits] = useState<string[]>(emptyOtp);
  const [rejections, setRejections] = useState(0);

  const expired = countdown.isExpired;
  const code = digits.join("");
  const canResend = Boolean(view.approverEmailMasked) && view.otpSendsRemaining !== 0;
  const resendKey = view.otpResendAvailableAt ?? "ready";

  function submit(value: string) {
    if (isVerifying || isResending || expired || value.length !== OTP_LENGTH) return;
    onVerify(value, () => {
      setDigits(emptyOtp());
      setRejections((n) => n + 1);
    });
  }

  return (
    <div className="space-y-5">
      <StepHeading step={2} title="Enter verification code" />

      <div className="space-y-3">
        <p className="flex items-start gap-2 text-sm text-slate-600">
          <Mail className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
          <span className="min-w-0">
            Code sent to {contact ? <MaskedContact value={contact} /> : "your registered contact"}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {countdown.isKnown && (
            <Badge
              variant="outline"
              role="timer"
              aria-live="off"
              className={cn(
                "gap-1.5 font-mono tabular",
                expired
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              )}
            >
              <Clock aria-hidden />
              {expired ? "Code expired" : `${countdown.label} left`}
            </Badge>
          )}
          <Badge variant="outline" className="text-slate-600 tabular">
            {view.otpAttemptsRemaining} of {OTP_MAX_ATTEMPTS} attempts left
          </Badge>
        </div>
      </div>

      {resent && !expired && (
        <p role="status" className="text-xs text-pretty text-slate-500">
          A new code was sent. Earlier codes no longer work.
        </p>
      )}

      {/* Keyed on the rejection count so the shake replays on every wrong code. */}
      <div
        key={rejections}
        className={cn(rejections > 0 && "animate-otp-shake motion-reduce:animate-none")}
      >
        <OtpInput
          value={digits}
          onChange={(next) => {
            setDigits(next);
            onEdit();
          }}
          onComplete={submit}
          disabled={isVerifying || isResending || expired}
          invalid={!!inlineError}
          focusKey={(autoFocus ? 1 : 0) + rejections}
          describedBy={inlineError ? "otp-error" : undefined}
        />
      </div>

      <p
        id="otp-error"
        role="alert"
        className={cn(
          "min-h-4 text-center text-xs font-medium text-rose-700",
          !inlineError && "sr-only"
        )}
      >
        {inlineError}
      </p>

      {notice && <NoticeAlert notice={notice} />}

      {expired ? (
        canResend ? (
          <ResendControl
            key={resendKey}
            availableAt={view.otpResendAvailableAt}
            sendsRemaining={view.otpSendsRemaining}
            isPending={isResending}
            disabled={isVerifying}
            prominent
            onResend={onResend}
          />
        ) : (
          <NoticeAlert
            notice={view.approverEmailMasked ? EXHAUSTED_NOTICE : LEGACY_NOTICE}
            icon={<Clock aria-hidden />}
          />
        )
      ) : (
        <>
          <Button
            type="button"
            onClick={() => submit(code)}
            disabled={code.length !== OTP_LENGTH || isVerifying || isResending}
            className={CTA_CLASS}
          >
            {isVerifying ? SPINNER : <ShieldCheck className="size-4" aria-hidden />}
            {isVerifying ? "Verifying…" : "Confirm & Authorize Campaign"}
          </Button>
          {view.approverEmailMasked && (
            <ResendControl
              key={resendKey}
              availableAt={view.otpResendAvailableAt}
              sendsRemaining={view.otpSendsRemaining}
              isPending={isResending}
              disabled={isVerifying}
              prominent={false}
              onResend={onResend}
            />
          )}
        </>
      )}
    </div>
  );
}

export function OtpPanel({ token, view }: { token: string; view: ApprovalViewDto }) {
  const request = useRequestApprovalOtp(token);
  const verify = useVerifyManagerOtp(token);
  const [failure, setFailure] = useState<OtpFailure | null>(null);
  const [sentThisVisit, setSentThisVisit] = useState(false);
  const [resent, setResent] = useState(false);

  if (view.otpLocked || failure?.kind === "locked") {
    return <NoticeAlert notice={LOCKED_NOTICE} icon={<Lock aria-hidden />} />;
  }

  const notice = failure ? describeFailure(failure) : null;
  if (failure && notice && TERMINAL_KINDS.has(failure.kind)) {
    return <NoticeAlert notice={notice} />;
  }

  function requestCode() {
    const isResend = view.otpRequested;
    setFailure(null);
    request.mutate(undefined, {
      onSuccess: () => {
        setSentThisVisit(true);
        setResent(isResend);
      },
      onError: (err) => {
        console.error("Approval code request failed", err);
        setFailure(readOtpFailure(err));
      },
    });
  }

  function verifyCode(code: string, onRejected: () => void) {
    setFailure(null);
    verify.mutate(code, {
      onError: (err) => {
        console.error("Manager OTP verification failed", err);
        setFailure(readOtpFailure(err));
        onRejected();
      },
    });
  }

  if (!view.otpRequested) {
    if (!view.approverEmailMasked) return <NoticeAlert notice={LEGACY_NOTICE} />;
    return (
      <RequestStep
        email={view.approverEmailMasked}
        notice={notice}
        isPending={request.isPending}
        onRequest={requestCode}
      />
    );
  }

  const incorrect = failure?.kind === "incorrect" ? failure : null;

  return (
    <CodeStep
      key={view.otpExpiresAt ?? "no-expiry"}
      view={view}
      contact={view.approverEmailMasked || view.approverPhoneMasked || null}
      notice={incorrect ? null : notice}
      inlineError={incorrect ? attemptsMessage(incorrect.attemptsRemaining) : null}
      isVerifying={verify.isPending}
      isResending={request.isPending}
      autoFocus={sentThisVisit}
      resent={resent}
      onVerify={verifyCode}
      onEdit={() => {
        if (incorrect) setFailure(null);
      }}
      onResend={requestCode}
    />
  );
}
