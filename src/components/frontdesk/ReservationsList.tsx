import { Calendar, LogIn, X } from 'lucide-react';
import { fmtDateTime } from '../../lib/format';
import type { Transaction } from '../../types';

interface ReservationsListProps {
  reservations: Transaction[];
  now: Date;
  onCheckIn: (txn: Transaction) => void;
  onCancel: (txn: Transaction) => void;
}

export default function ReservationsList({
  reservations,
  now,
  onCheckIn,
  onCancel,
}: ReservationsListProps) {
  if (reservations.length === 0) return null;

  return (
    <section className="mt-8">
      <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
        <Calendar size={18} className="text-brand" /> Upcoming Reservations
      </h3>
      <div className="space-y-2.5">
        {reservations.map((t) => {
          const late = new Date(t.timeIn) < now;
          return (
            <div
              key={t.ref}
              className="card flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold">
                  {t.guestName}{' '}
                  <span className="font-normal text-muted">· Room {t.roomIds.join(', ')}</span>
                </div>
                <div className="mt-0.5 text-xs tabular-nums text-muted">
                  {fmtDateTime(t.timeIn)} · {t.hours}h · {t.ref}
                  {late && (
                    <span className="ml-2 font-semibold text-overdue-bright">
                      Arrival time passed
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => onCheckIn(t)} className="btn-primary px-3 py-1.5 text-xs">
                  <LogIn size={14} /> Check In Now
                </button>
                <button
                  onClick={() => onCancel(t)}
                  className="btn-outline px-3 py-1.5 text-xs text-overdue-bright"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
