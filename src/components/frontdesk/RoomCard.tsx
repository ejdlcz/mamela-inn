import { Bed, Check, Clock, Users } from 'lucide-react';
import { fmtMoney, pad2, remaining } from '../../lib/format';
import type { Room } from '../../types';

// Full class names (not built dynamically) so Tailwind can see them.
const LOOKS = {
  vacant: { label: 'Vacant', box: 'border-vacant-bright bg-vacant shadow-key-vacant' },
  occupied: { label: 'Occupied', box: 'border-occupied-bright bg-occupied shadow-key-occupied' },
  overdue: { label: 'Overdue', box: 'border-overdue-bright bg-overdue shadow-key-overdue' },
} as const;

interface RoomCardProps {
  room: Room;
  now: Date;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (room: Room) => void;
}

export default function RoomCard({
  room,
  now,
  selectMode,
  selected,
  onToggleSelect,
  onOpen,
}: RoomCardProps) {
  const occupied = room.status === 'occupied';
  let look: (typeof LOOKS)[keyof typeof LOOKS] = LOOKS.vacant;
  let timeLabel = '';

  if (occupied) {
    const { overdue, h, m } = remaining(new Date(room.timeOut ?? now).getTime() - now.getTime());
    look = overdue ? LOOKS.overdue : LOOKS.occupied;
    timeLabel = overdue ? `Overdue by ${h}h ${pad2(m)}m` : `${h}h ${pad2(m)}m left`;
  }

  const handleClick = () => {
    if (selectMode && !occupied) onToggleSelect(room.id);
    else onOpen(room);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`Room ${room.number}, ${look.label}`}
      className={
        'key-tag relative min-h-[clamp(150px,15vw,200px)] rounded-2xl border-[3px] px-4 pb-4 pt-8 text-left text-white transition-all duration-150 ' +
        'hover:-translate-y-0.5 active:translate-y-1 active:shadow-key-pressed ' +
        look.box +
        (selected ? ' ring-4 ring-brand-bright ring-offset-2 ring-offset-base' : '')
      }
    >
      {selectMode && !occupied && (
        <span
          className={
            'absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 ' +
            (selected ? 'border-white bg-white text-vacant' : 'border-white/70 text-transparent')
          }
        >
          <Check size={14} />
        </span>
      )}

      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider">
        {occupied ? <Users size={13} /> : <Bed size={13} />}
        {look.label}
      </span>

      <div className="mt-2.5 font-display text-4xl font-bold leading-none tabular-nums lg:text-5xl">
        {room.number}
      </div>

      {occupied ? (
        <div className="mt-3 space-y-1">
          <div className="truncate text-sm font-semibold">{room.guestName || 'Guest'}</div>
          <div className="flex w-fit items-center gap-1 rounded-md bg-black/20 px-1.5 py-0.5 text-xs font-bold tabular-nums">
            <Clock size={12} /> {timeLabel}
          </div>
        </div>
      ) : (
        <div className="mt-3 text-xs font-semibold opacity-90">
          {fmtMoney(room.rate)}/hr · tap to check in
        </div>
      )}
    </button>
  );
}
