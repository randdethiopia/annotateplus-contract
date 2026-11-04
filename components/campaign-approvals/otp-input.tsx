"use client";

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export const OTP_LENGTH = 6;

export function emptyOtp(): string[] {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

/**
 * Six single-digit boxes that behave like one field: typing advances, Backspace
 * on an empty box steps back, and a paste or SMS autofill of the whole code is
 * spread across every box.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  focusKey,
  describedBy,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Changing this moves focus back to the first box, e.g. after a rejected code. */
  focusKey?: number;
  describedBy?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focusBox = (index: number) => {
    const box = refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))];
    box?.focus();
    box?.select();
  };

  // Not on mount: autofocus would scroll a phone past the summary the manager
  // is meant to read before authorizing.
  useEffect(() => {
    if (!focusKey || disabled) return;
    refs.current[0]?.focus();
  }, [focusKey, disabled]);

  function commit(next: string[]) {
    onChange(next);
    if (next.every((digit) => digit !== "")) onComplete?.(next.join(""));
  }

  function spread(digits: string, start: number) {
    // A full-length code always lands from the first box, wherever focus was.
    const from = digits.length >= OTP_LENGTH ? 0 : start;
    const next = [...value];
    const chars = digits.slice(0, OTP_LENGTH - from).split("");
    chars.forEach((digit, offset) => {
      next[from + offset] = digit;
    });
    commit(next);
    focusBox(from + chars.length);
  }

  function handleChange(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length > 1) {
      spread(digits, index);
      return;
    }
    const next = [...value];
    next[index] = digits;
    commit(next);
    if (digits && index < OTP_LENGTH - 1) focusBox(index + 1);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      event.preventDefault();
      const next = [...value];
      next[index - 1] = "";
      onChange(next);
      focusBox(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    event.preventDefault();
    spread(digits, index);
  }

  return (
    <div
      role="group"
      aria-label="Approval code"
      aria-describedby={describedBy}
      className="grid grid-cols-6 gap-2 sm:gap-3"
    >
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-12 w-full rounded-xl border bg-white text-center font-mono text-xl font-bold text-slate-900 tabular transition-all outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 sm:h-14",
            invalid ? "border-rose-300" : digit ? "border-slate-300" : "border-slate-200"
          )}
        />
      ))}
    </div>
  );
}
