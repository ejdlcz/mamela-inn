import { Bed, Check, Clock, Users } from 'lucide-react';
import { fmtMoney, pad2, remaining } from '../../lib/format';
import type { Density } from '../../lib/layout';
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
  /** Narrow screen: shorter texts. */
  narrow: boolean;
  /** How much the button can show for the height it has (phones only; see useGridDensity). */
  density: Density;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (room: Room) => void;
}

export default function RoomCard({
  room,
  now,
  narrow,
  density,
  selectMode,
  selected,
  onToggleSelect,
  onOpen,
}: RoomCardProps) {
  const occupied = room.status === 'occupied';
  const tiny = density === 'tiny';
  const dense = density !== 'comfortable';
  let look: (typeof LOOKS)[keyof typeof LOOKS] = LOOKS.vacant;
  let timeLabel = '';

  if (occupied) {
    const { overdue, h, m } = remaining(new Date(room.timeOut ?? now).getTime() - now.getTime());
    look = overdue ? LOOKS.overdue : LOOKS.occupied;
    const hm = `${h}h ${pad2(m)}m`;
    timeLabel = overdue ? (narrow ? `-${hm}` : `Overdue by ${hm}`) : narrow ? hm : `${hm} left`;
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
        // Phones: the button stretches to fill its grid row, and shows less when the row is short
        // (so the time left never gets cut off). Bigger screens keep a comfortable minimum height.
        (tiny ? '' : 'key-tag ') +
        'relative flex min-h-[110px] flex-col overflow-hidden rounded-xl border-[3px] px-2.5 text-left text-white transition-all duration-150 ' +
        (tiny ? 'pb-1.5 pt-2 ' : dense ? 'pb-1.5 pt-5 ' : 'pb-2 pt-6 ') +
        'phone:min-h-0 sm:min-h-[clamp(150px,15vw,200px)] sm:rounded-2xl sm:px-4 sm:pb-4 sm:pt-8 ' +
        'hover:-translate-y-0.5 active:translate-y-1 active:shadow-key-pressed ' +
        look.box +
        (selected ? ' ring-4 ring-brand-bright ring-offset-2 ring-offset-base' : '')
      }
    >
      {selectMode && !occupied && (
        <span
          className={
            'absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 sm:right-2.5 sm:top-2.5 sm:h-6 sm:w-6 ' +
            (selected ? 'border-white bg-white text-vacant' : 'border-white/70 text-transparent')
          }
        >
          <Check size={14} />
        </span>
      )}

      {!tiny && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider sm:px-2.5 sm:py-1 sm:text-[11px]">
          {occupied ? (
            <Users size={13} className="hidden sm:block" />
          ) : (
            <Bed size={13} className="hidden sm:block" />
          )}
          {look.label}
        </span>
      )}

      <div
        className={
          'font-display font-bold leading-none tabular-nums sm:mt-2.5 sm:text-4xl lg:text-5xl ' +
          (dense ? 'text-2xl ' : 'mt-1 text-3xl ')
        }
      >
        {room.number}
      </div>

      {occupied ? (
        // Phones: time left sits ABOVE the guest name, so if space runs out the name goes first.
        <div className="mt-auto flex min-w-0 flex-col-reverse gap-0.5 pt-1 sm:mt-3 sm:flex-col sm:gap-1">
          <div
            className={
              'truncate text-xs font-semibold sm:block sm:text-sm ' + (dense ? 'hidden' : '')
            }
          >
            {room.guestName || 'Guest'}
          </div>
          <div className="flex w-fit items-center gap-1 rounded-md bg-black/20 px-1.5 py-0.5 text-[11px] font-bold tabular-nums sm:text-xs">
            <Clock size={12} className="hidden sm:block" /> {timeLabel}
          </div>
        </div>
      ) : (
        <div className="mt-auto pt-1 text-[11px] font-semibold opacity-90 sm:mt-3 sm:text-xs">
          {fmtMoney(room.rate)}/hr<span className="hidden sm:inline"> · tap to check in</span>
        </div>
      )}
    </button>
  );
}
