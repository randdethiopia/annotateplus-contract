"use client";

import { useSyncExternalStore } from "react";

/**
 * Cooldowns are displayed in whole hours, so the tick exists only to catch the
 * moment a cooldown expires — 30s bounds how long a row can keep claiming
 * "Wait 1h" after it has actually become sendable.
 */
const TICK_MS = 30_000;

let tick = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // One interval for every reminder control on the page rather than one each,
  // so a 20-row queue does not schedule 20 timers.
  if (!timer) {
    timer = setInterval(() => {
      tick += 1;
      listeners.forEach((notify) => notify());
    }, TICK_MS);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  return tick;
}

/**
 * A bare re-render driver for time-dependent reminder labels.
 *
 * The counter value is never meant to be read — callers get the current time
 * from `Date.now()` inside `getReminderState`. Storing a counter rather than a
 * timestamp is what keeps the server snapshot and the first client snapshot
 * both 0, so a cooldown chip cannot produce a hydration mismatch.
 */
export function useReminderTick(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
