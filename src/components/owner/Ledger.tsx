import { Download, FileSpreadsheet, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PAYMENT_METHODS } from '../../config/defaults';
import { useIsNarrow } from '../../hooks/useMediaQuery';
import { useToast } from '../../hooks/useToast';
import { downloadCsv, downloadXlsx, guestsText } from '../../lib/export';
import { fmtDateTime, fmtMoney } from '../../lib/format';
import { formatOverstay } from '../../lib/overdue';
import type { Transaction } from '../../types';
import StatusBadge from '../ui/StatusBadge';

const COLUMNS = [
  'Reference #',
  'Time In',
  'Time Out',
  'Checked Out',
  'Guest',
  'Guests',
  'Room(s)',
  'Hrs',
  'Payment',
  'Amount',
  'Overstay',
  'Status',
  'Notes',
];
const selectClass = 'field w-full py-2 text-sm sm:w-auto';

/** Start/end of a yyyy-mm-dd day in local time. */
const dayStart = (v: string) => new Date(`${v}T00:00:00`).getTime();
const dayEnd = (v: string) => new Date(`${v}T23:59:59.999`).getTime();

/** Extra info shown at the end of a row: cancellation / refund, automatic checkout. */
function notesFor(t: Transaction): string {
  const parts: string[] = [];
  if (t.status === 'cancelled') {
    const why = [t.cancelReason, t.cancelNote].filter(Boolean).join(' — ');
    parts.push(`${why || 'Cancelled'} · Refund ${fmtMoney(t.refundAmount ?? 0)}`);
  }
  if (t.autoCheckedOut) parts.push('Auto checked out');
  return parts.join(' · ');
}

const overstayText = (t: Transaction) =>
  t.overstayMinutes && t.overstayMinutes > 0 ? formatOverstay(t.overstayMinutes) : '';

export default function Ledger({ txns }: { txns: Transaction[] }) {
  const toast = useToast();
  const narrow = useIsNarrow();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txns.filter((t) => {
      if (status !== 'all' && t.status !== status) return false;
      if (payment !== 'all' && t.paymentMethod !== payment) return false;
      const inTime = new Date(t.timeIn).getTime();
      if (from && inTime < dayStart(from)) return false;
      if (to && inTime > dayEnd(to)) return false;
      if (q && !`${t.ref} ${t.guestName} ${t.roomIds.join(' ')}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [txns, query, status, payment, from, to]);

  const run = async (job: () => Promise<void>, doneMsg: string) => {
    try {
      await job();
      toast(doneMsg);
    } catch {
      toast('Export failed. Please try again.', 'error');
    }
  };

  return (
    <div>
      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference, guest, room…"
            className="field py-2.5 pl-9 text-sm"
            aria-label="Search transactions"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClass}
            aria-label="Filter by status"
          >
            <option value="all" className="text-black">
              All statuses
            </option>
            <option value="active" className="text-black">
              Active
            </option>
            <option value="scheduled" className="text-black">
              Scheduled
            </option>
            <option value="completed" className="text-black">
              Completed
            </option>
            <option value="cancelled" className="text-black">
              Cancelled
            </option>
          </select>
          <select
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            className={selectClass}
            aria-label="Filter by payment method"
          >
            <option value="all" className="text-black">
              All payments
            </option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m} className="text-black">
                {m}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={selectClass}
            aria-label="From date"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={selectClass}
            aria-label="To date"
          />
          <button
            onClick={() => run(() => downloadCsv(filtered, 'inn-transactions'), 'CSV exported.')}
            className="btn-outline h-11 sm:ml-auto sm:h-auto"
          >
            <Download size={15} /> CSV
          </button>
          <button
            onClick={() =>
              run(
                () => downloadXlsx(filtered, 'inn-transactions', 'Transactions'),
                'Spreadsheet exported.',
              )
            }
            className="btn-primary h-11 sm:h-auto"
          >
            <FileSpreadsheet size={15} /> Excel
          </button>
        </div>
      </div>

      {narrow ? (
        /* ---- phones: one card per transaction (no sideways scrolling) ---- */
        <div className="space-y-2.5">
          {filtered.length === 0 && (
            <div className="card px-4 py-10 text-center text-sm text-muted">
              No transactions match your filters.
            </div>
          )}
          {filtered.map((t) => {
            const notes = notesFor(t);
            const over = overstayText(t);
            return (
              <div key={t.ref} className="card p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{t.guestName}</div>
                    <div className="text-xs text-muted">
                      Room {t.roomIds.join(', ')} · {guestsText(t)}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div>
                    <dt className="text-muted">Time in</dt>
                    <dd className="font-semibold tabular-nums">{fmtDateTime(t.timeIn)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Time out</dt>
                    <dd className="font-semibold tabular-nums">{fmtDateTime(t.timeOut)}</dd>
                  </div>
                  {t.actualTimeOut && (
                    <div>
                      <dt className="text-muted">Checked out</dt>
                      <dd className="font-semibold tabular-nums">{fmtDateTime(t.actualTimeOut)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted">Amount · {t.paymentMethod}</dt>
                    <dd className="font-semibold tabular-nums">
                      {fmtMoney(t.totalAmount)} · {t.hours}h
                    </dd>
                  </div>
                  {over && (
                    <div>
                      <dt className="text-muted">Overstay</dt>
                      <dd className="font-semibold text-overdue-bright">{over}</dd>
                    </div>
                  )}
                </dl>

                {notes && (
                  <div className="mt-2 rounded-lg bg-ink/[0.05] px-2.5 py-1.5 text-xs">{notes}</div>
                )}
                <div className="mt-2 text-[11px] tabular-nums text-muted">{t.ref}</div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ---- tablets / desktops: table ---- */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand/10">
                  {COLUMNS.map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left font-semibold text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-muted">
                      No transactions match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((t) => (
                  <tr key={t.ref} className="border-t border-line">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">
                      {t.ref}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {fmtDateTime(t.timeIn)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {fmtDateTime(t.timeOut)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {t.actualTimeOut ? fmtDateTime(t.actualTimeOut) : '—'}
                    </td>
                    <td className="px-4 py-3">{t.guestName}</td>
                    <td className="whitespace-nowrap px-4 py-3">{guestsText(t)}</td>
                    <td className="px-4 py-3 tabular-nums">{t.roomIds.join(', ')}</td>
                    <td className="px-4 py-3 tabular-nums">{t.hours}</td>
                    <td className="px-4 py-3">{t.paymentMethod}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {fmtMoney(t.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-overdue-bright">
                      {overstayText(t) || <span className="font-normal text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="min-w-48 px-4 py-3 text-xs">
                      {notesFor(t) || <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="mt-2 text-xs text-muted">
        {filtered.length} of {txns.length} transactions shown.
      </div>
    </div>
  );
}
