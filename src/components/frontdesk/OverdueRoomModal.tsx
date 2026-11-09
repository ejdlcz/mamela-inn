import { CheckCircle2, Clock, LogIn, X } from 'lucide-react';
import { useNow } from '../../hooks/useNow';
import { fmtDateTime } from '../../lib/format';
import { formatOverstay, overstayMinutes } from '../../lib/overdue';
import type { Room, Transaction } from '../../types';
import Modal from '../ui/Modal';

interface OverdueRoomModalProps {
  room: Room;
  /** the stay that ran over (already closed automatically) */
  txn: Transaction | undefined;
  onConfirmLeft: (room: Room) => void;
  onBook: (room: Room) => void;
  onClose: () => void;
}

/** A room whose guest overstayed and was removed automatically, until someone confirms they left. */
export default function OverdueRoomModal({
  room,
  txn,
  onConfirmLeft,
  onBook,
  onClose,
}: OverdueRoomModalProps) {
  const now = useNow(1000);
  const timeOut = room.timeOut ?? txn?.timeOut ?? now.toISOString();
  const minutes = overstayMinutes(timeOut, now);

  return (
    <Modal onClose={onClose} label={`Room ${room.number} overdue`}>
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="label">Room</div>
            <div className="font-display text-3xl font-semibold">{room.number}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2.5 hover:bg-ink/10">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-overdue/15 px-4 py-3 text-sm font-medium text-overdue-bright">
          <Clock size={16} className="shrink-0" />
          {room.guestName ?? 'Guest'} stayed {formatOverstay(minutes)} past the time-out. They were
          checked out automatically.
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-muted">Scheduled time out</dt>
            <dd className="font-semibold">{fmtDateTime(timeOut)}</dd>
          </div>
          <div>
            <dt className="text-muted">Reference #</dt>
            <dd className="font-semibold tabular-nums">{room.overstayRef}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-muted">
          When the guest has really left, confirm it so their overstay time is recorded. Booking
          this room again also records it.
        </p>

        <div className="mt-4 grid gap-3">
          <button onClick={() => onConfirmLeft(room)} className="btn-success h-12">
            <CheckCircle2 size={18} /> Confirm guest left
          </button>
          <button onClick={() => onBook(room)} className="btn-outline h-12">
            <LogIn size={18} /> Book this room
          </button>
        </div>
      </div>
    </Modal>
  );
}
