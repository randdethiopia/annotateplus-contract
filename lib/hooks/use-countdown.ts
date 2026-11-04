"use client";

import { useEffect, useState } from "react";

function formatMmSs(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Time left until `expiresAt`, re-read from the clock on every tick rather than
 * decremented, so a throttled background tab is still exact when it wakes.
 */
export function useCountdown(expiresAt: string | undefined) {
  const target = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const isKnown = Number.isFinite(target);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isKnown) return;
    const id = window.setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      if (tick >= target) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isKnown, target]);

  const remainingMs = isKnown ? Math.max(0, target - now) : 0;
  // Ceil, so the display reads 00:01 for the final second and 00:00 only once expired.
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return {
    isKnown,
    remainingMs,
    isExpired: isKnown && remainingMs <= 0,
    label: formatMmSs(remainingSeconds),
  };
}
