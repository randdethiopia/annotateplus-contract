"use client";

import { Ban, CalendarX, Clock, Download, Loader2, PartyPopper, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignedBanner } from "@/components/contracts/signed-banner";

export function PendingReviewScreen() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
      <Clock className="mx-auto mb-4 size-10 text-amber-600" />
      <p className="text-lg font-semibold text-amber-800">Your submission is under review</p>
      <p className="mt-2 text-sm text-slate-500">
        Your submission is being verified by our HR team. This page updates automatically.
      </p>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-700">
        <Loader2 className="size-4 animate-spin" />
        <span>Checking for updates…</span>
      </div>
    </div>
  );
}

export function SignedSuccessScreen({
  onDownload,
  isDownloading,
}: {
  onDownload: () => void;
  isDownloading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
        <PartyPopper className="mx-auto mb-4 size-10 text-green-600" />
        <p className="text-xl font-semibold text-green-800">Verified &amp; Signed!</p>
        <p className="mt-2 text-sm text-slate-500">
          Your agreement has been approved. Download your signed copy below.
        </p>
        <Button
          type="button"
          size="lg"
          className="mt-6"
          onClick={onDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Download className="size-5" />
          )}
          Download Signed Agreement (PDF)
        </Button>
      </div>
      <SignedBanner />
    </div>
  );
}

export function ExpiredScreen() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <CalendarX className="mx-auto mb-4 size-10 text-slate-500" />
      <p className="text-lg font-semibold text-slate-900">This signing link has expired</p>
      <p className="mt-2 text-sm text-slate-500">
        The deadline to sign this agreement has passed. Please contact HR to request a new link.
      </p>
    </div>
  );
}

export function CancelledScreen() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <Ban className="mx-auto mb-4 size-10 text-slate-500" />
      <p className="text-lg font-semibold text-slate-900">This contract was cancelled</p>
      <p className="mt-2 text-sm text-slate-500">
        This agreement is no longer active. Please contact HR if you have questions.
      </p>
    </div>
  );
}

export function RejectedScreen() {
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <XCircle className="mx-auto mb-4 size-10 text-red-500" />
      <p className="text-lg font-semibold text-red-800">This contract was not approved</p>
      <p className="mt-2 text-sm text-slate-500">
        All submission attempts have been used. Please contact HR if you believe this is a mistake.
      </p>
    </div>
  );
}

export function InvitedLoadingScreen() {
  return (
    <div className="flex justify-center rounded-2xl border border-gray-100 bg-white py-16 shadow-sm">
      <Loader2 className="size-8 animate-spin text-slate-400" />
    </div>
  );
}
