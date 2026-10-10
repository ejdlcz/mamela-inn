import { DEFAULT_ROOMS, DEFAULT_SETTINGS, STORAGE_KEYS } from '../config/defaults';
import type { Room, Settings, Transaction } from '../types';
import type { DataStore, Snapshot } from './DataStore';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error('Browser storage is unavailable or full.');
  }
}

function upsertBy<T>(list: T[], item: T, same: (a: T) => boolean): T[] {
  const i = list.findIndex(same);
  if (i === -1) return [...list, item];
  const copy = [...list];
  copy[i] = item;
  return copy;
}

function loadSnapshot(): Snapshot {
  return {
    rooms: read<Room[]>(STORAGE_KEYS.rooms, DEFAULT_ROOMS),
    txns: read<Transaction[]>(STORAGE_KEYS.txns, []),
    settings: { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(STORAGE_KEYS.settings, {}) },
  };
}

/** Data lives in this browser only. Great for a single front-desk computer. */
export function createLocalStore(): DataStore {
  return {
    mode: 'local',
    async load() {
      return loadSnapshot();
    },
    async saveRoom(room) {
      const rooms = read<Room[]>(STORAGE_KEYS.rooms, DEFAULT_ROOMS);
      write(
        STORAGE_KEYS.rooms,
        upsertBy(rooms, room, (r) => r.id === room.id),
      );
    },
    async deleteRoom(id) {
      const rooms = read<Room[]>(STORAGE_KEYS.rooms, DEFAULT_ROOMS);
      write(
        STORAGE_KEYS.rooms,
        rooms.filter((r) => r.id !== id),
      );
    },
    async insertTxn(txn) {
      const txns = read<Transaction[]>(STORAGE_KEYS.txns, []);
      if (txns.some((t) => t.ref === txn.ref)) {
        throw new Error(`Reference ${txn.ref} already exists.`);
      }
      write(STORAGE_KEYS.txns, [txn, ...txns]);
    },
    async updateTxn(txn) {
      const txns = read<Transaction[]>(STORAGE_KEYS.txns, []);
      write(
        STORAGE_KEYS.txns,
        txns.map((t) => (t.ref === txn.ref ? txn : t)),
      );
    },
    async saveSettings(settings) {
      write(STORAGE_KEYS.settings, settings);
    },
    subscribe(onEvent) {
      // Keeps several open tabs of the same browser in sync.
      const handler = (e: StorageEvent) => {
        const watched: string[] = [STORAGE_KEYS.rooms, STORAGE_KEYS.txns, STORAGE_KEYS.settings];
        if (e.key && watched.includes(e.key)) {
          onEvent({ kind: 'snapshot', data: loadSnapshot() });
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}
