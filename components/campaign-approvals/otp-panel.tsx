"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Lock, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readOtpFailure, useVerifyManagerOtp } from "@/lib/hooks/use-campaign-approval";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { cn } from "@/lib/utils";
import type { ApprovalViewDto } from "@/types/backend";
import { OTP_LENGTH, OtpInput, emptyOtp } from "./otp-input";

/** Resend stays disabled for the first five minutes of a 25-minute code, to spare the carrier. */
const RESEND_UNLOCK_REMAINING_MS = 20 * 60 * 1000;

function formatShort(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function attemptsMessage(attemptsRemaining: number | undefined): string {
  if (attemptsRemaining === undefined) return "Incorrect code. Check the SMS and try again.";
  return `Incorrect code. ${attemptsRemaining} ${
    attemptsRemaining === 1 ? "attempt" : "attempts"
  } remaining.`;
}

function HrResendNote({ phone }: { phone: string }) {
  return (
    <p
      role="status"
      className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center text-xs text-pretty text-slate-600"
    >
      Codes are re-issued by HR. Ask HR to resend the approval link to{" "}
      <span className="font-mono font-medium text-slate-900 tabular">{phone}</span>.
    </p>
  );
}

function LockedState() {
  return (
    <div role="alert" className="space-y-3 py-2 text-center">
      <span
        className="bg-destructive-soft text-destructive mx-auto flex size-12 items-center justify-center rounded-2xl"
        aria-hidden
      >
        <Lock className="size-5" />
      </span>
      <p className="text-base font-semibold text-slate-900">Approval code locked</p>
      <p className="text-sm text-pretty text-slate-500">
        Too many incorrect attempts. Contact HR to resend the approval link.
      </p>
    </div>
  );
}

export function OtpPanel({ token, view }: { token: string; view: ApprovalViewDto }) {
  const countdown = useCountdown(view.otpExpiresAt);
  const verify = useVerifyManagerOtp(token);

  const [digits, setDigits] = useState<string[]>(emptyOtp);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(!!view.otpLocked);
  const [expiredByServer, setExpiredByServer] = useState(false);
  const [rejections, setRejections] = useState(0);
  const [showHrNote, setShowHrNote] = useState(false);
  // Review first: the code boxes stay hidden until the manager chooses to authorize.
  const [revealed, setRevealed] = useState(false);

  const expired = countdown.isExpired || expiredByServer;
  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH;
  const canResend =
    expired || !countdown.isKnown || countdown.remainingMs <= RESEND_UNLOCK_REMAINING_MS;

  if (locked) return <LockedState />;

  function submit(value: string) {
    if (verify.isPending || expired || value.length !== OTP_LENGTH) return;
    setError(null);
    verify.mutate(value, {
      onError: (err) => {
        console.error("Manager OTP verification failed", err);
        const failure = readOtpFailure(err);
        setDigits(emptyOtp());
        if (failure.kind === "locked") {
          setLocked(true);
        } else if (failure.kind === "expired") {
          setExpiredByServer(true);
        } else {
          setError(
            failure.kind === "incorrect" ? attemptsMessage(failure.attemptsRemaining) : failure.message
          );
          setRejections((n) => n + 1);
        }
      },
    });
  }

  if (!revealed) {
    return (
      <div className="space-y-3">
        <Button
          type="button"
          onClick={() => setRevealed(true)}
          className="h-12 w-full rounded-xl text-base font-medium"
        >
          Authorize with SMS Code
          <ArrowRight className="size-4" aria-hidden />
        </Button>
        <p className="text-center text-xs text-slate-500">
          You&apos;ll confirm with the one-time code sent to{" "}
          <span className="font-mono text-slate-700 tabular">{view.approverPhoneMasked}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-2 space-y-5 duration-300 motion-reduce:animate-none">
      <div className="space-y-2 text-center">
        <h2 className="text-base font-semibold text-slate-900">Enter Approval Code</h2>
        <p className="text-xs text-slate-500">
          AfroMessage SMS sent to{" "}
          <span className="font-mono text-slate-700 tabular">{view.approverPhoneMasked}</span>
        </p>
        {countdown.isKnown && (
          <p
            role="timer"
            aria-live="off"
            className={cn(
              "mx-auto w-fit rounded-full px-2 py-1 font-mono text-xs font-medium tabular",
              expired ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
            )}
          >
            {expired ? "Code expired" : `${countdown.label} remaining`}
          </p>
        )}
      </div>

      {/* Keyed on the rejection count so the shake replays on every wrong code. */}
      <div
        key={rejections}
        className={cn(rejections > 0 && "animate-otp-shake motion-reduce:animate-none")}
      >
        <OtpInput
          value={digits}
          onChange={(next) => {
            setDigits(next);
            if (error) setError(null);
          }}
          onComplete={submit}
          disabled={verify.isPending || expired}
          invalid={!!error}
          // Always non-zero once revealed, so the first box takes focus on reveal and after each rejection.
          focusKey={rejections + 1}
          describedBy={error ? "otp-error" : undefined}
        />
      </div>

      <p
        id="otp-error"
        role="alert"
        className={cn("min-h-4 text-center text-xs font-medium text-rose-700", !error && "sr-only")}
      >
        {error}
      </p>

      {expired ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowHrNote(true)}
          className="h-12 w-full rounded-full text-sm font-semibold"
        >
          <RotateCw className="size-4" aria-hidden />
          Send code again
        </Button>
      ) : (
        <Button
          type="button"
          onClick={() => submit(code)}
          disabled={!isComplete || verify.isPending}
          className="h-12 w-full rounded-xl text-base font-medium"
        >
          {verify.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
              Verifying…
            </>
          ) : (
            <>
              Confirm &amp; Authorize Disbursement
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      )}

      {!expired && (
        <p className="text-center text-xs text-slate-500">
          Didn&apos;t receive code?{" "}
          <button
            type="button"
            onClick={() => setShowHrNote(true)}
            disabled={!canResend}
            className="text-action rounded font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          >
            Resend SMS
          </button>
          {!canResend && (
            <span className="text-slate-400 tabular">
              {" "}
              in {formatShort(countdown.remainingMs - RESEND_UNLOCK_REMAINING_MS)}
            </span>
          )}
        </p>
      )}

      {showHrNote && <HrResendNote phone={view.approverPhoneMasked} />}
    </div>
  );
}
