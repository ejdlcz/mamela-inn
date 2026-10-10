const PHP = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export const fmtMoney = (n: number) => PHP.format(Number(n) || 0);
export const pad2 = (n: number) => String(n).padStart(2, '0');

export function fmtDateTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDate(d: Date) {
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtClock(d: Date) {
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** Split a millisecond difference into overdue flag + hours + minutes. */
export function remaining(msLeft: number) {
  const overdue = msLeft < 0;
  const abs = Math.abs(msLeft);
  return {
    overdue,
    h: Math.floor(abs / 3_600_000),
    m: Math.floor((abs % 3_600_000) / 60_000),
  };
}
