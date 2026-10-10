import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { fmtDate } from '../../lib/format';

interface DatePickerProps {
  value: Date;
  onChange: (d: Date) => void;
}

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Calendar-grid date picker that opens inline (no popovers to get clipped on phones). */
export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => startOfMonth(value));

  const toggle = () => {
    setView(startOfMonth(value));
    setOpen((o) => !o);
  };

  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(view.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = new Date();

  const pick = (day: number) => {
    onChange(
      new Date(view.getFullYear(), view.getMonth(), day, value.getHours(), value.getMinutes()),
    );
    setOpen(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="field flex items-center gap-2 text-left"
        aria-expanded={open}
      >
        <Calendar size={16} className="shrink-0 text-brand" />
        <span className="truncate tabular-nums">{fmtDate(value)}</span>
      </button>

      {open && (
        <div className="mt-2 animate-rise rounded-xl border border-line bg-base p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              className="rounded-md p-1.5 hover:bg-ink/10"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="font-display text-sm font-semibold">
              {view.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="button"
              aria-label="Next month"
              className="rounded-md p-1.5 hover:bg-ink/10"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const date = new Date(view.getFullYear(), view.getMonth(), day);
              const selected = sameDay(date, value);
              const isToday = sameDay(date, today);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(day)}
                  className={
                    'h-9 rounded-md text-sm font-semibold tabular-nums transition-colors ' +
                    (selected
                      ? 'bg-brand text-white'
                      : isToday
                        ? 'border-2 border-brand'
                        : 'hover:bg-ink/10')
                  }
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
