import { useEffect, useMemo, useRef } from 'react';

interface NumberWheelProps {
  label: string;
  value: number;
  min: number;
  max: number;
  /** Spoken name of one option, e.g. (n) => `${n} adults` */
  optionLabel: (n: number) => string;
  onChange: (n: number) => void;
}

const ITEM = 40; // px height of one row

/**
 * A scroll-wheel number picker: swipe / scroll to the number, or tap it.
 * Keyboard: focus it and use the Up / Down arrows.
 */
export default function NumberWheel({
  label,
  value,
  min,
  max,
  optionLabel,
  onChange,
}: NumberWheelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number>();
  const ignoreScrollUntil = useRef(0);
  const numbers = useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [min, max],
  );

  // Keep the wheel sitting on the chosen number (first render, taps, arrow keys).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    ignoreScrollUntil.current = Date.now() + 300;
    el.scrollTop = (value - min) * ITEM;
  }, [value, min]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  // When the finger/wheel stops, pick the number that is in the middle row.
  const onScroll = () => {
    if (Date.now() < ignoreScrollUntil.current) return;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const index = Math.min(numbers.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)));
      if (numbers[index] !== value) onChange(numbers[index]);
    }, 90);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && value < max) {
      e.preventDefault();
      onChange(value + 1);
    } else if (e.key === 'ArrowUp' && value > min) {
      e.preventDefault();
      onChange(value - 1);
    }
  };

  return (
    <div>
      <div className="label mb-1 text-center">{label}</div>
      <div className="relative h-[120px] overflow-hidden rounded-lg border border-line bg-base">
        <div
          ref={listRef}
          role="listbox"
          aria-label={label}
          tabIndex={0}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          style={{ scrollPaddingTop: ITEM }}
          className="h-full snap-y snap-mandatory overflow-y-scroll outline-none [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand [&::-webkit-scrollbar]:hidden"
        >
          <div style={{ height: ITEM }} />
          {numbers.map((n) => (
            <button
              key={n}
              type="button"
              role="option"
              aria-selected={n === value}
              aria-label={optionLabel(n)}
              onClick={() => onChange(n)}
              className={
                'flex h-10 w-full snap-start items-center justify-center text-xl tabular-nums transition-colors ' +
                (n === value ? 'font-bold text-ink' : 'text-muted')
              }
            >
              {n}
            </button>
          ))}
          <div style={{ height: ITEM }} />
        </div>
        {/* highlight band over the middle row */}
        <div className="pointer-events-none absolute inset-x-0 top-10 h-10 border-y-2 border-brand/50 bg-brand/10" />
      </div>
    </div>
  );
}
