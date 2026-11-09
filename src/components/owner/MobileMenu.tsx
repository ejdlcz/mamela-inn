import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

/** Header of a phone "page": a Back button and a centered title (like the phone's Settings app). */
export function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-4 grid grid-cols-[5.5rem_1fr_5.5rem] items-center">
      <button
        onClick={onBack}
        aria-label="Back"
        className="flex h-11 items-center gap-0.5 rounded-lg pr-3 font-semibold text-brand"
      >
        <ChevronLeft size={22} /> Back
      </button>
      <h2 className="truncate text-center font-display text-lg font-semibold">{title}</h2>
      <span />
    </div>
  );
}

export interface MenuItem {
  id: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  onClick: () => void;
}

/** A vertical list of big tappable rows with a chevron — nothing to scroll sideways. */
export function MenuList({ items }: { items: MenuItem[] }) {
  return (
    <div className="card divide-y divide-line overflow-hidden">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-ink/5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            {item.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{item.label}</span>
            {item.hint && <span className="block truncate text-xs text-muted">{item.hint}</span>}
          </span>
          <ChevronRight size={20} className="shrink-0 text-muted" />
        </button>
      ))}
    </div>
  );
}
