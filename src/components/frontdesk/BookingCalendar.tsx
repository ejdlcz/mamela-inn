import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { pad2 } from '../../lib/format';
import type { Transaction } from '../../types';
import Modal from '../ui/Modal';
import ReservationsList from './ReservationsList';

interface BookingCalendarProps {
  /** Scheduled (not yet checked-in) bookings */
  reservations: Transaction[];
  now: Date;
  onClose: () => void;
  onCheckIn: (txn: Transaction) => void;
  onCancel: (txn: Transaction) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const dayKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });

/**
 * Month calendar (Google-Calendar style) of every scheduled booking.
 * Tap a day to list its bookings on the side / below, where they can be
 * checked in or cancelled.
 */
export default function BookingCalendar({
  reservations,
  now,
  onClose,
  onCheckIn,
  onCancel,
}: BookingCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(now));
  const [selected, setSelected] = useState(() => dayKey(now));

  const byDay = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    for (const t of [...reservations].sort((a, b) => +new Date(a.timeIn) - +new Date(b.timeIn))) {
      (map[dayKey(new Date(t.timeIn))] ??= []).push(t);
    }
    return map;
  }, [reservations]);

  // 6 weeks, starting on the Sunday on/before the 1st of the month
  const cells = useMemo(() => {
    const lead = month.getDay();
    return Array.from(
      { length: 42 },
      (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - lead + i),
    );
  }, [month]);

  const goToday = () => {
    setMonth(startOfMonth(now));
    setSelected(dayKey(now));
  };
  const shift = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));

  const todayKey = dayKey(now);
  const selectedDate = new Date(`${selected}T00:00:00`);
  const navButton = 'flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink/10';

  return (
    <Modal onClose={onClose} xl label="Booking calendar">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-6">
        <h3 className="mr-2 flex items-center gap-2 font-display text-lg font-semibold">
          <Calendar size={18} className="text-brand" /> Booking calendar
        </h3>
        <button onClick={goToday} className="btn-outline px-3 py-1.5">
          Today
        </button>
        <button onClick={() => shift(-1)} aria-label="Previous month" className={navButton}>
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => shift(1)} aria-label="Next month" className={navButton}>
          <ChevronRight size={20} />
        </button>
        <div className="font-display text-lg font-semibold">
          {month.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={onClose}
          aria-label="Close calendar"
          className="ml-auto rounded-lg p-2.5 hover:bg-ink/10"
        >
          <X size={20} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:grid lg:grid-cols-[1fr_19rem] lg:gap-5">
        <div>
          <div className="grid grid-cols-7 pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted sm:text-xs">
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-b border-r border-line">
            {cells.map((date) => {
              const key = dayKey(date);
              const items = byDay[key] ?? [];
              const inMonth = date.getMonth() === month.getMonth();
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  aria-label={`${date.toDateString()}, ${items.length} booking${items.length === 1 ? '' : 's'}`}
                  aria-pressed={key === selected}
                  className={
                    'flex min-h-[3.4rem] flex-col gap-0.5 border-l border-t border-line p-1 text-left sm:min-h-[6.5rem] sm:p-1.5 ' +
                    (inMonth ? '' : 'bg-ink/[0.04] text-muted ') +
                    (key === selected ? 'relative z-10 ring-2 ring-inset ring-brand' : '')
                  }
                >
                  <span
                    className={
                      'mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:mx-0 ' +
                      (key === todayKey ? 'bg-brand text-white' : '')
                    }
                  >
                    {date.getDate()}
                  </span>

                  {/* tablets / desktops: booking chips */}
                  <div className="hidden space-y-0.5 sm:block">
                    {items.slice(0, 3).map((t) => (
                      <div
                        key={t.ref}
                        className={
                          'truncate rounded px-1.5 py-0.5 text-[11px] font-semibold text-white ' +
                          (new Date(t.timeIn) < now ? 'bg-overdue' : 'bg-brand')
                        }
                      >
                        {clock(t.timeIn)} {t.guestName}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="px-1 text-[11px] font-semibold text-muted">
                        +{items.length - 3} more
                      </div>
                    )}
                  </div>

                  {/* phones: dots */}
                  {items.length > 0 && (
                    <div className="flex items-center justify-center gap-0.5 sm:hidden">
                      {items.slice(0, 3).map((t) => (
                        <span key={t.ref} className="h-1.5 w-1.5 rounded-full bg-brand" />
                      ))}
                      {items.length > 3 && (
                        <span className="text-[10px] font-bold text-brand">+</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <section aria-label="Bookings on the selected day" className="mt-4 lg:mt-0">
          <h4 className="mb-2 font-display text-base font-semibold text-ink">
            {selectedDate.toLocaleDateString('en-PH', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h4>
          <ReservationsList
            reservations={byDay[selected] ?? []}
            now={now}
            onCheckIn={onCheckIn}
            onCancel={onCancel}
          />
        </section>
      </div>
    </Modal>
  );
}
