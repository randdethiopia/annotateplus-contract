import { Check, Circle } from "lucide-react";
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  utf8ByteLength,
} from "@/lib/validations/password.schema";
import { cn } from "@/lib/utils";

interface Requirement {
  key: string;
  label: string;
  met: boolean;
  meter?: { text: string; over: boolean };
}

export function PasswordChecklist({
  id,
  password,
  confirmPassword,
  currentPassword,
  className,
}: {
  id?: string;
  password: string;
  confirmPassword: string;
  currentPassword?: string;
  className?: string;
}) {
  const bytes = utf8ByteLength(password);
  const hasPassword = password.length > 0;

  const requirements: Requirement[] = [
    {
      key: "length",
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      key: "bytes",
      label: `No more than ${PASSWORD_MAX_BYTES} bytes`,
      met: hasPassword && bytes <= PASSWORD_MAX_BYTES,
      meter: { text: `${bytes}/${PASSWORD_MAX_BYTES}`, over: bytes > PASSWORD_MAX_BYTES },
    },
  ];

  if (currentPassword !== undefined) {
    requirements.push({
      key: "differs",
      label: "Different from your current password",
      met: hasPassword && password !== currentPassword,
    });
  }

  requirements.push({
    key: "match",
    label: "Confirmation matches",
    met: confirmPassword.length > 0 && password === confirmPassword,
  });

  return (
    <ul id={id} aria-label="Password requirements" className={cn("space-y-2", className)}>
      {requirements.map((requirement) => (
        <li
          key={requirement.key}
          className={cn(
            "flex items-center gap-2 text-xs transition-colors",
            requirement.met ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {requirement.met ? (
            <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <Circle className="size-3.5 shrink-0 text-slate-300" aria-hidden />
          )}
          <span className="min-w-0">{requirement.label}</span>
          <span className="sr-only">{requirement.met ? "(met)" : "(not met)"}</span>
          {requirement.meter && (
            <span
              className={cn(
                "ml-auto shrink-0 font-mono tabular",
                requirement.meter.over ? "text-destructive font-semibold" : "text-slate-400"
              )}
            >
              {requirement.meter.text}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
