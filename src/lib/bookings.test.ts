import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types';
import { findConflict } from './bookings';

const at = (h: number) => new Date(2030, 0, 1, h, 0, 0);

const txn = (over: Partial<Transaction>): Transaction => ({
  ref: 'INN-20300101-1000',
  guestName: 'Ana',
  roomIds: ['101'],
  hours: 3,
  timeIn: at(10).toISOString(),
  timeOut: at(13).toISOString(),
  paymentMethod: 'Cash',
  totalAmount: 540,
  status: 'scheduled',
  createdAt: at(8).toISOString(),
  ...over,
});

describe('findConflict', () => {
  it('detects an overlapping booking for the same room', () => {
    const c = findConflict([txn({})], ['101'], at(12), at(15));
    expect(c?.roomId).toBe('101');
    expect(c?.guestName).toBe('Ana');
  });

  it('allows back-to-back bookings (end == start)', () => {
    expect(findConflict([txn({})], ['101'], at(13), at(16))).toBeNull();
    expect(findConflict([txn({})], ['101'], at(7), at(10))).toBeNull();
  });

  it('ignores other rooms', () => {
    expect(findConflict([txn({})], ['102'], at(10), at(13))).toBeNull();
  });

  it('ignores completed and cancelled bookings', () => {
    const list = [txn({ status: 'completed' }), txn({ ref: 'X', status: 'cancelled' })];
    expect(findConflict(list, ['101'], at(10), at(13))).toBeNull();
  });

  it('counts active stays too', () => {
    expect(findConflict([txn({ status: 'active' })], ['101'], at(11), at(12))).not.toBeNull();
  });

  it('can ignore the booking being modified', () => {
    expect(findConflict([txn({})], ['101'], at(10), at(13), 'INN-20300101-1000')).toBeNull();
  });

  it('reports a conflict if any one of several rooms clashes', () => {
    expect(findConflict([txn({})], ['105', '101'], at(11), at(12))?.roomId).toBe('101');
  });
});
