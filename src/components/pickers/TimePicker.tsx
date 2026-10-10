import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { pad2 } from '../../lib/format';

interface TimePickerProps {
  value: Date;
  onChange: (d: Date) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/** Scroll-wheel style time picker (hour / minute / AM-PM) that opens inline. */
export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const h24 = value.getHours();
  const h12 = h24 % 12 || 12;
  const minute = value.getMinutes();
  const isPM = h24 >= 12;

  // When opened, scroll each wheel so the current value sits in the middle.
  useEffect(() => {
    if (!open) return;
    const center = (el: HTMLDivElement | null, index: number) => {
      const item = el?.children[index + 1] as HTMLElement | undefined; // +1 skips the top spacer
      if (el && item) el.scrollTop = item.offsetTop - el.clientHeight / 2 + item.clientHeight / 2;
    };
    center(hourRef.current, h12 - 1);
    center(minuteRef.current, minute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const emit = (hour24: number, min: number) =>
    onChange(new Date(value.getFullYear(), value.getMonth(), value.getDate(), hour24, min));

  const setHour12 = (h: number) => emit((h % 12) + (isPM ? 12 : 0), minute);
  const setPeriod = (pm: boolean) => emit((h12 % 12) + (pm ? 12 : 0), minute);

  const itemClass = (active: boolean) =>
    'w-full snap-center py-2.5 text-center text-sm font-bold tabular-nums ' +
    (active ? 'bg-brand text-white' : 'hover:bg-ink/10');

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="field flex items-center gap-2 text-left tabular-nums"
        aria-expanded={open}
      >
        <Clock size={16} className="shrink-0 text-brand" />
        <span>
          {pad2(h12)}:{pad2(minute)} {isPM ? 'PM' : 'AM'}
        </span>
      </button>

      {open && (
        <div className="mt-2 animate-rise rounded-xl border border-line bg-base p-3">
          <div className="flex gap-2">
            <div
              ref={hourRef}
              className="relative h-36 flex-1 snap-y snap-mandatory overflow-y-auto rounded-lg border border-line"
            >
              <div className="h-14" />
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHour12(h)}
                  className={itemClass(h === h12)}
                >
                  {pad2(h)}
                </button>
              ))}
              <div className="h-14" />
            </div>

            <div
              ref={minuteRef}
              className="relative h-36 flex-1 snap-y snap-mandatory overflow-y-auto rounded-lg border border-line"
            >
              <div className="h-14" />
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => emit(h24, m)}
                  className={itemClass(m === minute)}
                >
                  {pad2(m)}
                </button>
              ))}
              <div className="h-14" />
            </div>

            <div className="flex flex-col justify-center gap-1.5">
              {(['AM', 'PM'] as const).map((p) => {
                const active = (p === 'PM') === isPM;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p === 'PM')}
                    className={
                      'rounded-lg px-2.5 py-2.5 text-xs font-bold ' +
                      (active ? 'bg-brand text-white' : 'border border-line')
                    }
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full rounded-lg border border-line py-2 text-xs font-bold"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
