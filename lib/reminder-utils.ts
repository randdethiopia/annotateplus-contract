import type { ContractStatus } from "@/types/backend";

/** Backend-enforced cap. Mirrored here only so the UI can label the state. */
export const MAX_REMINDERS = 2;

/**
 * The one gate both queues read, so HR and finance can never drift apart.
 *
 * DRAFT is excluded deliberately: no invitation SMS has been dispatched for a
 * draft, so there is no signing link for a nudge to point at.
 */
export const REMINDABLE_STATUSES = [
  "INVITED",
  "VIEWED",
] as const satisfies readonly ContractStatus[];

export function isRemindable(status: string): boolean {
  return (REMINDABLE_STATUSES as readonly string[]).includes(status);
}

export interface ReminderState {
  canRemind: boolean;
  isMaxReached: boolean;
  isCooldownActive: boolean;
  cooldownHoursRemaining: number;
  displayText: string;
}

/**
 * Structural rather than one of the DTOs — the HR list row, the HR dossier and
 * the finance row all satisfy it, so one component can serve every surface.
 *
 * `createdAt` and `lastReminderSentAt` are part of the shape but deliberately
 * unread: `nextReminderAt` is the server's authority on the cooldown, and
 * recomputing it from a send timestamp would let a client clock disagree with
 * the endpoint that actually enforces it. `createdAt` is optional because
 * ContractDossierDto carries `agreementDate` instead.
 */
export interface RemindableContract {
  status: string;
  reminderCount?: number;
  lastReminderSentAt?: string;
  nextReminderAt?: string;
  createdAt?: string;
}

export function getReminderState(contract: RemindableContract): ReminderState {
  const idle: ReminderState = {
    canRemind: false,
    isMaxReached: false,
    isCooldownActive: false,
    cooldownHoursRemaining: 0,
    displayText: "",
  };

  if (!isRemindable(contract.status)) return idle;

  const count = contract.reminderCount ?? 0;

  if (count >= MAX_REMINDERS) {
    return { ...idle, isMaxReached: true, displayText: `Max (${count}/${MAX_REMINDERS})` };
  }

  const nextAt = contract.nextReminderAt ? Date.parse(contract.nextReminderAt) : NaN;
  const now = Date.now();

  // Number.isFinite guards a malformed timestamp into "eligible" rather than
  // rendering "Wait NaNh" and locking the action out permanently.
  if (Number.isFinite(nextAt) && nextAt > now) {
    const hoursLeft = Math.max(1, Math.ceil((nextAt - now) / 3_600_000));
    return {
      ...idle,
      isCooldownActive: true,
      cooldownHoursRemaining: hoursLeft,
      displayText:
        count === 0 ? `Wait ${hoursLeft}h` : `Sent (${count}/${MAX_REMINDERS}) · ${hoursLeft}h`,
    };
  }

  return {
    ...idle,
    canRemind: true,
    displayText: count === 0 ? "Send Reminder" : `Remind (${count}/${MAX_REMINDERS})`,
  };
}
