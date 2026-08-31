import { ShieldCheck } from "lucide-react";

export function SignedBanner({ documentHash }: { documentHash?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-emerald-900">
          This agreement has been digitally signed and verified.
        </p>
        <p className="mt-0.5 text-sm text-emerald-800/80">
          It was sealed by the system and cannot be altered.
          {documentHash && (
            <>
              {" "}
              Fingerprint:{" "}
              <span className="font-mono text-xs break-all">{documentHash.slice(0, 16)}…</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
