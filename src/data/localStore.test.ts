import { describe, expect, it } from 'vitest';
import { DEFAULT_ROOMS } from '../config/defaults';
import type { Transaction } from '../types';
import { createLocalStore } from './localStore';

const txn: Transaction = {
  ref: 'INN-20300101-1234',
  guestName: 'Ana',
  roomIds: ['101'],
  hours: 3,
  timeIn: '2030-01-01T02:00:00.000Z',
  timeOut: '2030-01-01T05:00:00.000Z',
  paymentMethod: 'GCash',
  totalAmount: 540,
  status: 'active',
  createdAt: '2030-01-01T02:00:00.000Z',
};

describe('localStore', () => {
  it('starts with the default rooms and settings', async () => {
    const snap = await createLocalStore().load();
    expect(snap.rooms).toHaveLength(DEFAULT_ROOMS.length);
    expect(snap.txns).toEqual([]);
    expect(snap.settings.innName).toBe("Mamela's Inn");
  });

  it('refuses to overwrite an existing reference', async () => {
    const store = createLocalStore();
    await store.insertTxn(txn);
    await expect(store.insertTxn({ ...txn, guestName: 'Someone else' })).rejects.toThrow(
      /already exists/,
    );
    expect((await store.load()).txns[0].guestName).toBe('Ana');
  });

  it('updates a transaction in place', async () => {
    const store = createLocalStore();
    await store.insertTxn(txn);
    await store.updateTxn({ ...txn, status: 'completed' });
    const { txns } = await store.load();
    expect(txns).toHaveLength(1);
    expect(txns[0].status).toBe('completed');
  });

  it('adds, edits and deletes rooms', async () => {
    const store = createLocalStore();
    const room = { ...DEFAULT_ROOMS[0], id: '999', number: '999', rate: 250 };
    await store.saveRoom(room);
    await store.saveRoom({ ...room, rate: 300 });
    expect((await store.load()).rooms.find((r) => r.id === '999')?.rate).toBe(300);
    await store.deleteRoom('999');
    expect((await store.load()).rooms.find((r) => r.id === '999')).toBeUndefined();
  });
});
