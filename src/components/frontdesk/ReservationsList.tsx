import { LogIn, X } from 'lucide-react';
import { fmtDateTime } from '../../lib/format';
import type { Transaction } from '../../types';

interface ReservationsListProps {
  reservations: Transaction[];
  now: Date;
  onCheckIn: (txn: Transaction) => void;
  onCancel: (txn: Transaction) => void;
}

/** Compact vertical cards: fits a narrow side column and the phone pop-up alike. */
export default function ReservationsList({
  reservations,
  now,
  onCheckIn,
  onCancel,
}: ReservationsListProps) {
  if (reservations.length === 0) {
    return <div className="py-6 text-center text-sm text-muted">No scheduled bookings.</div>;
  }

  return (
    <div className="space-y-2">
      {reservations.map((t) => {
        const late = new Date(t.timeIn) < now;
        return (
          <div key={t.ref} className="card p-3">
            <div className="truncate text-sm font-semibold text-ink">{t.guestName}</div>
            <div className="text-xs text-muted">Room {t.roomIds.join(', ')}</div>
            <div className="mt-0.5 text-xs tabular-nums text-muted">
              {fmtDateTime(t.timeIn)} · {t.hours}h
            </div>
            {late && (
              <div className="mt-0.5 text-xs font-semibold text-overdue-bright">
                Arrival time passed
              </div>
            )}
            <div className="mt-2 flex gap-1.5">
              <button
                onClick={() => onCheckIn(t)}
                className="btn-primary flex-1 px-2 py-2 text-xs sm:py-1.5"
              >
                <LogIn size={14} /> Check In Now
              </button>
              <button
                onClick={() => onCancel(t)}
                aria-label={`Cancel reservation for ${t.guestName}`}
                className="btn-outline px-3 py-2 text-xs text-overdue-bright hover:bg-ink/10 sm:px-2 sm:py-1.5"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
