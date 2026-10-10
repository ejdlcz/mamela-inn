import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_SETTINGS } from '../config/defaults';
import type { PaymentMethod, Room, RoomStatus, Settings, Transaction, TxnStatus } from '../types';
import type { DataStore } from './DataStore';

/* ---- Row shapes (snake_case, as stored in Postgres) ------------------------
   Keep these in sync with supabase/migrations/*.sql                           */
interface RoomRow {
  id: string;
  number: string;
  rate: number | string;
  status: RoomStatus;
  txn_id: string | null;
  guest_name: string | null;
  time_out: string | null;
}
interface TxnRow {
  ref: string;
  guest_name: string;
  room_ids: string[];
  hours: number | string;
  time_in: string;
  time_out: string;
  actual_time_out: string | null;
  payment_method: PaymentMethod;
  total_amount: number | string;
  status: TxnStatus;
  created_at: string;
}
interface SettingsRow {
  id: number;
  inn_name: string;
  tagline: string | null;
  owner_email: string | null;
  recipient_emails: string[] | null;
  tax_rate: number | string;
  default_rate: number | string;
}

/* ---- Mappers: Postgres row <-> app type ----------------------------------- */
export const rowToRoom = (r: RoomRow): Room => ({
  id: r.id,
  number: r.number,
  rate: Number(r.rate),
  status: r.status,
  txnId: r.txn_id,
  guestName: r.guest_name,
  timeOut: r.time_out,
});
export const roomToRow = (r: Room): RoomRow => ({
  id: r.id,
  number: r.number,
  rate: r.rate,
  status: r.status,
  txn_id: r.txnId,
  guest_name: r.guestName,
  time_out: r.timeOut,
});

export const rowToTxn = (r: TxnRow): Transaction => ({
  ref: r.ref,
  guestName: r.guest_name,
  roomIds: r.room_ids ?? [],
  hours: Number(r.hours),
  timeIn: r.time_in,
  timeOut: r.time_out,
  actualTimeOut: r.actual_time_out,
  paymentMethod: r.payment_method,
  totalAmount: Number(r.total_amount),
  status: r.status,
  createdAt: r.created_at,
});
export const txnToRow = (t: Transaction): TxnRow => ({
  ref: t.ref,
  guest_name: t.guestName,
  room_ids: t.roomIds,
  hours: t.hours,
  time_in: t.timeIn,
  time_out: t.timeOut,
  actual_time_out: t.actualTimeOut ?? null,
  payment_method: t.paymentMethod,
  total_amount: t.totalAmount,
  status: t.status,
  created_at: t.createdAt,
});

export const rowToSettings = (r: SettingsRow): Settings => ({
  innName: r.inn_name,
  tagline: r.tagline ?? '',
  ownerEmail: r.owner_email ?? '',
  recipientEmails: r.recipient_emails ?? [],
  taxRate: Number(r.tax_rate),
  defaultRate: Number(r.default_rate),
});
export const settingsToRow = (s: Settings): SettingsRow => ({
  id: 1,
  inn_name: s.innName,
  tagline: s.tagline,
  owner_email: s.ownerEmail,
  recipient_emails: s.recipientEmails,
  tax_rate: s.taxRate,
  default_rate: s.defaultRate,
});

/** Supabase returns at most 1000 rows per request, so read in pages. */
async function fetchAll<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const SIZE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += SIZE) {
    const { data, error } = await page(from, from + SIZE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < SIZE) break;
  }
  return out;
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function createSupabaseStore(client: SupabaseClient): DataStore {
  return {
    mode: 'supabase',

    async load() {
      const [rooms, txns, settings] = await Promise.all([
        fetchAll<RoomRow>((from, to) =>
          client.from('rooms').select('*').order('number').order('id').range(from, to),
        ),
        fetchAll<TxnRow>((from, to) =>
          client
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .order('ref')
            .range(from, to),
        ),
        client.from('settings').select('*').eq('id', 1).maybeSingle(),
      ]);
      check(settings.error);
      return {
        rooms: rooms.map(rowToRoom),
        txns: txns.map(rowToTxn),
        settings: settings.data
          ? rowToSettings(settings.data as SettingsRow)
          : { ...DEFAULT_SETTINGS },
      };
    },

    async saveRoom(room) {
      check((await client.from('rooms').upsert(roomToRow(room))).error);
    },
    async deleteRoom(id) {
      check((await client.from('rooms').delete().eq('id', id)).error);
    },
    async insertTxn(txn) {
      check((await client.from('transactions').insert(txnToRow(txn))).error);
    },
    async updateTxn(txn) {
      check((await client.from('transactions').update(txnToRow(txn)).eq('ref', txn.ref)).error);
    },
    async saveSettings(settings) {
      check((await client.from('settings').upsert(settingsToRow(settings))).error);
    },

    subscribe(onEvent) {
      let connectedBefore = false;
      const channel = client
        .channel(`inn-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (p) => {
          if (p.eventType === 'DELETE') {
            onEvent({
              kind: 'room',
              change: { type: 'delete', key: (p.old as { id: string }).id },
            });
          } else {
            onEvent({
              kind: 'room',
              change: { type: 'upsert', row: rowToRoom(p.new as RoomRow) },
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (p) => {
          if (p.eventType === 'DELETE') {
            onEvent({
              kind: 'txn',
              change: { type: 'delete', key: (p.old as { ref: string }).ref },
            });
          } else {
            onEvent({
              kind: 'txn',
              change: { type: 'upsert', row: rowToTxn(p.new as TxnRow) },
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (p) => {
          if (p.eventType !== 'DELETE') {
            onEvent({ kind: 'settings', settings: rowToSettings(p.new as SettingsRow) });
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // After a dropped connection we may have missed events: refetch.
            if (connectedBefore) onEvent({ kind: 'resync' });
            connectedBefore = true;
          }
        });
      return () => {
        void client.removeChannel(channel);
      };
    },
  };
}
