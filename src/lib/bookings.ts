import type { Transaction } from '../types';

export interface Conflict {
  roomId: string;
  guestName: string;
  timeIn: string;
  timeOut: string;
}

/**
 * Finds an existing booking (active or scheduled) that uses one of `roomIds`
 * during [start, end). Returns null when the rooms are free.
 * Pass `ignoreRef` to skip a transaction (e.g. the one being modified).
 */
export function findConflict(
  txns: Transaction[],
  roomIds: string[],
  start: Date | number,
  end: Date | number,
  ignoreRef?: string,
): Conflict | null {
  const s = +start;
  const e = +end;
  for (const t of txns) {
    if (t.ref === ignoreRef) continue;
    if (t.status !== 'active' && t.status !== 'scheduled') continue;
    const overlaps = s < new Date(t.timeOut).getTime() && new Date(t.timeIn).getTime() < e;
    if (!overlaps) continue;
    const shared = t.roomIds.find((id) => roomIds.includes(id));
    if (shared) {
      return { roomId: shared, guestName: t.guestName, timeIn: t.timeIn, timeOut: t.timeOut };
    }
  }
  return null;
}
