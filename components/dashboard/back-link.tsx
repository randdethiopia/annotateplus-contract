import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label = "Back to dashboard" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-action focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
