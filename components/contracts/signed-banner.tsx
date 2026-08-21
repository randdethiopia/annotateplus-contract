import { ShieldCheck } from "lucide-react";

export function SignedBanner({ documentHash }: { documentHash?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-600" />
      <div>
        <p className="font-semibold text-green-800">
          This contract has been digitally signed and verified.
        </p>
        <p className="mt-0.5 text-sm text-green-700">
          The agreement was sealed by the system and cannot be altered.
          {documentHash && (
            <>
              {" "}
              Document fingerprint: <span className="font-mono">{documentHash.slice(0, 16)}…</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
