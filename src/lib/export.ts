import type { Transaction } from '../types';
import { browserDownload } from './download';
import { fmtDateTime } from './format';
import { statusLabel } from './status';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const guestsText = (t: Pick<Transaction, 'adults' | 'children'>) => {
  const a = t.adults ?? 1;
  const c = t.children ?? 0;
  return `${a} adult${a === 1 ? '' : 's'}` + (c > 0 ? `, ${c} child${c === 1 ? '' : 'ren'}` : '');
};

export function toExportRows(txns: Transaction[]) {
  return txns.map((t) => ({
    'Reference #': t.ref,
    'Date & Time In': fmtDateTime(t.timeIn),
    'Scheduled Time Out': fmtDateTime(t.timeOut),
    'Actual Check-Out': t.actualTimeOut ? fmtDateTime(t.actualTimeOut) : '',
    'Guest Name': t.guestName,
    Guests: guestsText(t),
    'Room(s)': t.roomIds.join(', '),
    'Duration (hrs)': t.hours,
    'Payment Method': t.paymentMethod,
    'Total Amount': t.totalAmount,
    Status: statusLabel(t.status),
    'Overstay (min)': t.overstayMinutes ?? '',
    'Auto Checked Out': t.autoCheckedOut ? 'Yes' : '',
    'Cancel Reason': [t.cancelReason, t.cancelNote].filter(Boolean).join(' — '),
    'Refund Amount': t.refundAmount ?? '',
  }));
}

const todayStamp = () => new Date().toISOString().slice(0, 10);

/** The spreadsheet library is loaded on demand so it doesn't slow down page load. */
export async function downloadXlsx(txns: Transaction[], baseName: string, sheetName: string) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(toExportRows(txns));
  ws['!cols'] = [20, 22, 22, 22, 22, 16, 12, 12, 16, 14, 12, 14, 16, 30, 14].map((wch) => ({
    wch,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  browserDownload(`${baseName}-${todayStamp()}.xlsx`, buf, XLSX_MIME);
}

export async function downloadCsv(txns: Transaction[], baseName: string) {
  const XLSX = await import('xlsx');
  const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(toExportRows(txns)));
  browserDownload(`${baseName}-${todayStamp()}.csv`, csv, 'text/csv');
}
