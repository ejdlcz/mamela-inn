import type { Transaction } from '../types';

/** Whole minutes between the scheduled time-out and `at` (0 if not past it). */
export function overstayMinutes(timeOutIso: string, at: Date | number): number {
  return Math.max(0, Math.floor((+at - new Date(timeOutIso).getTime()) / 60_000));
}

/** The moment an overdue guest is removed automatically. */
export function graceDeadline(txn: Pick<Transaction, 'timeOut'>, graceMinutes: number): Date {
  return new Date(new Date(txn.timeOut).getTime() + Math.max(0, graceMinutes) * 60_000);
}

/** Active stays whose grace period has run out. */
export function dueForAutoCheckout(
  txns: Transaction[],
  graceMinutes: number,
  now: Date | number,
): Transaction[] {
  return txns.filter((t) => t.status === 'active' && +now >= +graceDeadline(t, graceMinutes));
}

/**
 * What to record when the system checks a guest out. The checkout time is the end of
 * the grace period (not "now"), so the data is right even if the app was closed.
 */
export function autoCheckoutPatch(txn: Transaction, graceMinutes: number): Transaction {
  return {
    ...txn,
    status: 'completed',
    actualTimeOut: graceDeadline(txn, graceMinutes).toISOString(),
    overstayMinutes: Math.max(0, Math.round(graceMinutes)),
    autoCheckedOut: true,
  };
}

/** 25 -> "25 min", 65 -> "1h 05m" */
export function formatOverstay(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}
