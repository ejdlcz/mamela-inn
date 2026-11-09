import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types';
import {
  autoCheckoutPatch,
  dueForAutoCheckout,
  formatOverstay,
  graceDeadline,
  overstayMinutes,
} from './overdue';

const txn = (over: Partial<Transaction> = {}): Transaction => ({
  ref: 'INN-20300101-1000',
  guestName: 'Ana',
  roomIds: ['101'],
  hours: 3,
  timeIn: '2030-01-01T02:00:00.000Z',
  timeOut: '2030-01-01T05:00:00.000Z',
  paymentMethod: 'Cash',
  totalAmount: 540,
  status: 'active',
  createdAt: '2030-01-01T02:00:00.000Z',
  ...over,
});
const at = (hhmm: string) => new Date(`2030-01-01T${hhmm}:00.000Z`);

describe('overdue helpers', () => {
  it('counts whole minutes past the time-out, never negative', () => {
    expect(overstayMinutes(txn().timeOut, at('05:00'))).toBe(0);
    expect(overstayMinutes(txn().timeOut, at('05:25'))).toBe(25);
    expect(overstayMinutes(txn().timeOut, at('04:10'))).toBe(0);
  });

  it('removes a guest only once the grace period has fully passed', () => {
    expect(dueForAutoCheckout([txn()], 15, at('05:14'))).toHaveLength(0);
    expect(dueForAutoCheckout([txn()], 15, at('05:15'))).toHaveLength(1);
  });

  it('follows the grace period setting', () => {
    expect(dueForAutoCheckout([txn()], 30, at('05:20'))).toHaveLength(0);
    expect(dueForAutoCheckout([txn()], 0, at('05:00'))).toHaveLength(1);
  });

  it('ignores stays that are not active', () => {
    const list = [txn({ status: 'completed' }), txn({ ref: 'B', status: 'scheduled' })];
    expect(dueForAutoCheckout(list, 15, at('09:00'))).toHaveLength(0);
  });

  it('records the checkout at the end of the grace period', () => {
    const patch = autoCheckoutPatch(txn(), 15);
    expect(patch.status).toBe('completed');
    expect(patch.actualTimeOut).toBe(graceDeadline(txn(), 15).toISOString());
    expect(patch.overstayMinutes).toBe(15);
    expect(patch.autoCheckedOut).toBe(true);
  });

  it('formats overstay times', () => {
    expect(formatOverstay(25)).toBe('25 min');
    expect(formatOverstay(65)).toBe('1h 05m');
  });
});
