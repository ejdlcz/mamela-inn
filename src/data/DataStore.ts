import type { Room, Settings, Transaction } from '../types';

export interface Snapshot {
  rooms: Room[];
  txns: Transaction[];
  settings: Settings;
}

export type Change<T> = { type: 'upsert'; row: T } | { type: 'delete'; key: string };

/** Live updates pushed from the store (other tabs / other devices). */
export type StoreEvent =
  | { kind: 'snapshot'; data: Snapshot }
  | { kind: 'room'; change: Change<Room> }
  | { kind: 'txn'; change: Change<Transaction> }
  | { kind: 'settings'; settings: Settings }
  /** connection came back — refetch everything */
  | { kind: 'resync' };

/**
 * Everything the app needs from a database. There are two implementations:
 *   - localStore    (browser storage, zero setup)
 *   - supabaseStore (shared Postgres, live sync)
 * To use another backend (Firebase, your own API…), implement this interface
 * and return it from createDataStore() in ./index.ts.
 */
export interface DataStore {
  readonly mode: 'local' | 'supabase';
  load(): Promise<Snapshot>;
  saveRoom(room: Room): Promise<void>;
  deleteRoom(id: string): Promise<void>;
  /** Must fail if the reference already exists (never overwrite). */
  insertTxn(txn: Transaction): Promise<void>;
  updateTxn(txn: Transaction): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  subscribe(onEvent: (event: StoreEvent) => void): () => void;
}
