import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ApplyForm } from "./apply-form";

const TITLE = "Annotator Recruitment Application | R&D Group";
const DESCRIPTION =
  "Join Ethiopia's premier AI data labeling workforce. Complete your verified details to apply.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: ["/logo/rd-group-logo.png"],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { src } = await searchParams;
  const raw = Array.isArray(src) ? src[0] : src;
  const source = raw?.trim().slice(0, 64) || "DIRECT";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100/70 via-slate-50/40 to-slate-100/30 px-4 py-10 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(148,163,184,0.12),transparent)]"
      />
      <div className="relative flex w-full flex-col items-center">
        <header className="flex flex-col items-center text-center">
          <BrandLogo size="md" />
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs text-slate-600 shadow-2xs">
            <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
            Verified Official Application Portal &middot; 2026 Intake
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-balance text-slate-900 sm:text-3xl">
            Annotator Recruitment Application
          </h1>
          <p className="mt-2 max-w-md text-sm text-pretty text-slate-500">
            Join Ethiopia&apos;s premier AI data annotation workforce.
          </p>
        </header>

        <ApplyForm source={source} />

        <p className="mt-6 text-center text-xs text-slate-400">
          R&amp;D Group &middot; Your information is used only for recruitment purposes.
        </p>
      </div>
    </main>
  );
}
