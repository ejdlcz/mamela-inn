import { Download, FileSpreadsheet, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PAYMENT_METHODS } from '../../config/defaults';
import { useToast } from '../../hooks/useToast';
import { downloadCsv, downloadXlsx } from '../../lib/export';
import { fmtDateTime, fmtMoney } from '../../lib/format';
import type { Transaction } from '../../types';
import StatusBadge from '../ui/StatusBadge';

const COLUMNS = [
  'Reference #',
  'Time In',
  'Time Out',
  'Guest',
  'Room(s)',
  'Hrs',
  'Payment',
  'Amount',
  'Status',
];
const selectClass = 'field w-auto py-2 text-sm';

/** Start/end of a yyyy-mm-dd day in local time. */
const dayStart = (v: string) => new Date(`${v}T00:00:00`).getTime();
const dayEnd = (v: string) => new Date(`${v}T23:59:59.999`).getTime();

export default function Ledger({ txns }: { txns: Transaction[] }) {
  const toast = useToast();
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
      <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference, guest, room…"
            className="field py-2 pl-9 text-sm"
            aria-label="Search transactions"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              All payment methods
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
            className="btn-outline"
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
            className="btn-primary"
          >
            <FileSpreadsheet size={15} /> Export to Excel
          </button>
        </div>
      </div>

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
                  <td className="px-4 py-3">{t.guestName}</td>
                  <td className="px-4 py-3 tabular-nums">{t.roomIds.join(', ')}</td>
                  <td className="px-4 py-3 tabular-nums">{t.hours}</td>
                  <td className="px-4 py-3">{t.paymentMethod}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {fmtMoney(t.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted">
        {filtered.length} of {txns.length} transactions shown.
      </div>
    </div>
  );
}
