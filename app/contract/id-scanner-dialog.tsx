"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, AlertCircle, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface IdScannerDialogProps {
  onDigitsDetected: (digits: string) => void;
  disabled?: boolean;
}

type ScanStatus = "starting" | "ready" | "processing" | "error";

// Longest run of digits in the OCR text is almost always the printed ID
// number (dashes/spaces on the card break up any other numbers).
function extractDigitRun(text: string): string {
  const runs = text.match(/\d[\d\s-]*\d|\d/g) ?? [];
  const cleaned = runs.map((run) => run.replace(/\D/g, ""));
  return cleaned.reduce((longest, run) => (run.length > longest.length ? run : longest), "");
}

export default function IdScannerDialog({ onDigitsDetected, disabled }: IdScannerDialogProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ScanStatus>("starting");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) return;

    setStatus("starting");
    setError(null);

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn't access the camera. Check permissions and try again.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open]);

  async function handleCapture() {
    const video = videoRef.current;
    if (!video || status !== "ready") return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setStatus("processing");
    try {
      const Tesseract = await import("tesseract.js");
      const { data } = await Tesseract.recognize(canvas.toDataURL("image/png"), "eng");
      const digits = extractDigitRun(data.text);

      if (!digits) {
        setError("Couldn't read a number from that image. Try holding the ID closer and steady.");
        setStatus("ready");
        return;
      }

      onDigitsDetected(digits);
      setOpen(false);
    } catch {
      setError("Something went wrong reading the ID. Please try again.");
      setStatus("ready");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="h-9 gap-2 border-[#34a853]/30 text-[#34a853] hover:bg-[#34a853]/10 hover:text-[#34a853]"
      >
        <Camera className="size-4" />
        Scan ID
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan your ID</DialogTitle>
          <DialogDescription>
            Hold your Fayda ID steady in front of the camera, with the printed number in frame.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          {status === "starting" && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}
          {status === "processing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm">Reading ID…</span>
            </div>
          )}
          {status === "ready" && (
            <div className="pointer-events-none absolute inset-6 rounded-md border-2 border-dashed border-white/70" />
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="size-3.5" />
            {error}
          </p>
        )}

        <Button
          type="button"
          onClick={handleCapture}
          disabled={status !== "ready"}
          className="w-full h-11 bg-[#34a853] hover:bg-[#2c9247] text-white font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <ScanLine className="size-4" />
          Capture & Read
        </Button>
      </DialogContent>
    </Dialog>
  );
}
