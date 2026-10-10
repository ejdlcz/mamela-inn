import { Download, Mail } from 'lucide-react';
import { useMemo } from 'react';
import { useToast } from '../../hooks/useToast';
import { downloadXlsx } from '../../lib/export';
import { fmtMoney } from '../../lib/format';
import type { Settings, Transaction } from '../../types';

interface ReportsProps {
  txns: Transaction[];
  settings: Settings;
}

const stat = (label: string, value: string) => (
  <div className="card p-5">
    <div className="label">{label}</div>
    <div className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</div>
  </div>
);

export default function Reports({ txns, settings }: ReportsProps) {
  const toast = useToast();

  // Same rule as the weekly email: stays that started in the last 7 days.
  // Reservations that haven't happened yet (and cancelled ones) don't count.
  const last7 = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 3_600_000;
    return txns.filter(
      (t) => (t.status === 'active' || t.status === 'completed') && +new Date(t.timeIn) >= cutoff,
    );
  }, [txns]);

  const revenue = last7.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
  const upcoming = txns.filter((t) => t.status === 'scheduled').length;
  const recipients = [settings.ownerEmail, ...settings.recipientEmails].filter(Boolean).join(', ');

  const generate = async () => {
    try {
      await downloadXlsx(last7, 'weekly-report', 'Last 7 Days');
      toast('Weekly report generated.');
    } catch {
      toast('Report generation failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat('Stays, last 7 days', String(last7.length))}
        {stat('Revenue, last 7 days', fmtMoney(revenue))}
        {stat('Upcoming reservations', String(upcoming))}
        <div className="card p-5">
          <div className="label">Report recipients</div>
          <div className="mt-1 text-sm font-semibold leading-snug">{recipients || '—'}</div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-brand/15 p-2 text-brand-bright">
            <Mail size={20} />
          </div>
          <div className="flex-1">
            <div className="font-display text-lg font-semibold">Automated weekly email report</div>
            <p className="mt-1 text-sm text-muted">
              The <code>weekly-report</code> Supabase Edge Function emails these same rows as a
              spreadsheet to <strong>{recipients || 'the addresses in Admin Settings'}</strong> on a
              schedule (see the README to switch it on). It needs the Supabase setup — it can't run
              from the browser alone. Use the button to download the same report right now.
            </p>
            <button onClick={generate} className="btn-primary mt-3">
              <Download size={16} /> Generate Last-7-Days Report Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
