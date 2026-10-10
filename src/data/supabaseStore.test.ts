import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../config/defaults';
import type { Room, Transaction } from '../types';
import {
  roomToRow,
  rowToRoom,
  rowToSettings,
  rowToTxn,
  settingsToRow,
  txnToRow,
} from './supabaseStore';

describe('supabase row mappers', () => {
  it('round-trips a room', () => {
    const room: Room = {
      id: '101',
      number: '101',
      rate: 180,
      status: 'occupied',
      txnId: 'INN-1',
      guestName: 'Ana',
      timeOut: '2030-01-01T05:00:00.000Z',
    };
    expect(rowToRoom(roomToRow(room))).toEqual(room);
  });

  it('round-trips a transaction', () => {
    const t: Transaction = {
      ref: 'INN-20300101-1234',
      guestName: 'Ana',
      roomIds: ['101', '102'],
      hours: 6,
      timeIn: '2030-01-01T02:00:00.000Z',
      timeOut: '2030-01-01T08:00:00.000Z',
      actualTimeOut: null,
      paymentMethod: 'Maya',
      totalAmount: 2160,
      status: 'scheduled',
      createdAt: '2029-12-30T00:00:00.000Z',
    };
    expect(rowToTxn(txnToRow(t))).toEqual(t);
  });

  it('turns numeric strings from Postgres into numbers', () => {
    const room = rowToRoom({ ...roomToRow({ ...DEFAULT_ROOM }), rate: '250.00' });
    expect(room.rate).toBe(250);
  });

  it('round-trips settings and tolerates nulls', () => {
    expect(rowToSettings(settingsToRow(DEFAULT_SETTINGS))).toEqual(DEFAULT_SETTINGS);
    const s = rowToSettings({
      id: 1,
      inn_name: 'X',
      tagline: null,
      owner_email: null,
      recipient_emails: null,
      tax_rate: '0',
      default_rate: '180',
    });
    expect(s.recipientEmails).toEqual([]);
    expect(s.tagline).toBe('');
  });
});

const DEFAULT_ROOM: Room = {
  id: '101',
  number: '101',
  rate: 180,
  status: 'vacant',
  txnId: null,
  guestName: null,
  timeOut: null,
};
