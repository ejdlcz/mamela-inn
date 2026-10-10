import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS } from '../config/defaults';
import { createDataStore, type Change, type Snapshot, type StoreEvent } from '../data';
import type { Room, Settings, Transaction } from '../types';

const sortRooms = (rooms: Room[]) =>
  [...rooms].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
const sortTxns = (txns: Transaction[]) =>
  [...txns].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

function applyChange<T>(list: T[], change: Change<T>, keyOf: (t: T) => string): T[] {
  if (change.type === 'delete') return list.filter((x) => keyOf(x) !== change.key);
  const key = keyOf(change.row);
  const i = list.findIndex((x) => keyOf(x) === key);
  if (i === -1) return [...list, change.row];
  const copy = [...list];
  copy[i] = change.row;
  return copy;
}

/**
 * Single source of truth for rooms, transactions and settings.
 * Writes update the screen instantly (optimistic) and are then saved through
 * the DataStore; if saving fails the data is reloaded and the error rethrown.
 */
export function useInnData() {
  const store = useMemo(() => createDataStore(), []);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySnapshot = useCallback((s: Snapshot) => {
    setRooms(sortRooms(s.rooms));
    setTxns(sortTxns(s.txns));
    setSettings(s.settings);
  }, []);

  const reload = useCallback(async () => {
    try {
      applySnapshot(await store.load());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load data.');
    } finally {
      setReady(true);
    }
  }, [store, applySnapshot]);

  useEffect(() => {
    void reload();

    const unsubscribe = store.subscribe((e: StoreEvent) => {
      switch (e.kind) {
        case 'snapshot':
          applySnapshot(e.data);
          break;
        case 'room':
          setRooms((prev) => sortRooms(applyChange(prev, e.change, (r) => r.id)));
          break;
        case 'txn':
          setTxns((prev) => sortTxns(applyChange(prev, e.change, (t) => t.ref)));
          break;
        case 'settings':
          setSettings(e.settings);
          break;
        case 'resync':
          void reload();
          break;
      }
    });

    // Tablets that slept or tabs left in the background catch up when shown again.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [store, reload, applySnapshot]);

  const run = useCallback(
    async (optimistic: () => void, persist: () => Promise<void>) => {
      optimistic();
      try {
        await persist();
      } catch (err) {
        await reload();
        throw err;
      }
    },
    [reload],
  );

  return useMemo(
    () => ({
      mode: store.mode,
      ready,
      error,
      rooms,
      txns,
      settings,
      reload,

      saveRoom: (room: Room) =>
        run(
          () =>
            setRooms((prev) =>
              sortRooms(applyChange(prev, { type: 'upsert', row: room }, (r) => r.id)),
            ),
          () => store.saveRoom(room),
        ),
      deleteRoom: (id: string) =>
        run(
          () => setRooms((prev) => prev.filter((r) => r.id !== id)),
          () => store.deleteRoom(id),
        ),
      /** New transaction. Fails (instead of overwriting) if the reference exists. */
      createTxn: (txn: Transaction) =>
        run(
          () => setTxns((prev) => sortTxns([...prev, txn])),
          () => store.insertTxn(txn),
        ),
      updateTxn: (txn: Transaction) =>
        run(
          () => setTxns((prev) => prev.map((t) => (t.ref === txn.ref ? txn : t))),
          () => store.updateTxn(txn),
        ),
      saveSettings: (next: Settings) =>
        run(
          () => setSettings(next),
          () => store.saveSettings(next),
        ),
    }),
    [store, ready, error, rooms, txns, settings, reload, run],
  );
}

export type InnData = ReturnType<typeof useInnData>;
