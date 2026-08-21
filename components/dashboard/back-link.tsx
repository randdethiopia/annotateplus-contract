import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label = "Back to dashboard" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  );
}
