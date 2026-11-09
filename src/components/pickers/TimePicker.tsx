import { Check, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { pad2 } from '../../lib/format';
import Modal from '../ui/Modal';

interface TimePickerProps {
  value: Date;
  onChange: (d: Date) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/** A button showing the time; tapping it opens scroll wheels (hour / minute / AM-PM) in a pop-up. */
export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const h24 = value.getHours();
  const h12 = h24 % 12 || 12;
  const minute = value.getMinutes();
  const isPM = h24 >= 12;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="field flex items-center gap-2 text-left tabular-nums"
        aria-haspopup="dialog"
      >
        <Clock size={16} className="shrink-0 text-brand" />
        <span>
          {pad2(h12)}:{pad2(minute)} {isPM ? 'PM' : 'AM'}
        </span>
      </button>

      {open && <TimeSheet value={value} onChange={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}

function TimeSheet({
  value,
  onChange,
  onClose,
}: TimePickerProps & {
  onClose: () => void;
}) {
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const h24 = value.getHours();
  const h12 = h24 % 12 || 12;
  const minute = value.getMinutes();
  const isPM = h24 >= 12;

  // Start with the current hour and minute in the middle of each wheel.
  useEffect(() => {
    const center = (el: HTMLDivElement | null, index: number) => {
      const item = el?.children[index + 1] as HTMLElement | undefined; // +1 skips the top spacer
      if (el && item) el.scrollTop = item.offsetTop - el.clientHeight / 2 + item.clientHeight / 2;
    };
    center(hourRef.current, h12 - 1);
    center(minuteRef.current, minute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = (hour24: number, min: number) =>
    onChange(new Date(value.getFullYear(), value.getMonth(), value.getDate(), hour24, min));
  const setHour12 = (h: number) => emit((h % 12) + (isPM ? 12 : 0), minute);
  const setPeriod = (pm: boolean) => emit((h12 % 12) + (pm ? 12 : 0), minute);

  const item = (active: boolean) =>
    'w-full snap-center py-3.5 text-center text-base font-bold tabular-nums ' +
    (active ? 'bg-brand text-white' : 'hover:bg-ink/10');
  const wheel =
    'relative h-56 flex-1 snap-y snap-mandatory overflow-y-auto rounded-lg border border-line';

  return (
    <Modal onClose={onClose} label="Pick a time">
      <div className="p-4 sm:p-5">
        <div className="mb-3 text-center font-display text-lg font-semibold tabular-nums">
          {pad2(h12)}:{pad2(minute)} {isPM ? 'PM' : 'AM'}
        </div>

        <div className="flex gap-2">
          <div ref={hourRef} className={wheel} aria-label="Hour">
            <div className="h-24" />
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHour12(h)}
                className={item(h === h12)}
              >
                {pad2(h)}
              </button>
            ))}
            <div className="h-24" />
          </div>

          <div ref={minuteRef} className={wheel} aria-label="Minute">
            <div className="h-24" />
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => emit(h24, m)}
                className={item(m === minute)}
              >
                {pad2(m)}
              </button>
            ))}
            <div className="h-24" />
          </div>

          <div className="flex flex-col justify-center gap-2">
            {(['AM', 'PM'] as const).map((p) => {
              const active = (p === 'PM') === isPM;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p === 'PM')}
                  className={
                    'rounded-lg px-4 py-3.5 text-sm font-bold ' +
                    (active ? 'bg-brand text-white' : 'border border-line')
                  }
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={onClose} className="btn-primary mt-4 w-full">
          <Check size={16} /> Done
        </button>
      </div>
    </Modal>
  );
}
