import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BuilderBreadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <Link
        href="/hr/campaigns"
        className="inline-flex items-center gap-1.5 rounded-md font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to Campaigns
      </Link>
      <span className="text-slate-300" aria-hidden>
        /
      </span>
      <span aria-current="page" className="font-semibold text-slate-900">
        New Campaign
      </span>
    </nav>
  );
}
