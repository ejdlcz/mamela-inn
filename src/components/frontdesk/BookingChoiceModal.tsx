import { CalendarPlus, LogIn, X } from 'lucide-react';
import Modal from '../ui/Modal';

interface BookingChoiceModalProps {
  roomIds: string[];
  onCheckIn: () => void;
  onSchedule: () => void;
  onClose: () => void;
}

/** Shown after tapping a room (or "Book Selected"): start the stay now, or reserve it for later. */
export default function BookingChoiceModal({
  roomIds,
  onCheckIn,
  onSchedule,
  onClose,
}: BookingChoiceModalProps) {
  return (
    <Modal onClose={onClose} label="Choose booking type">
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="label">{roomIds.length === 1 ? 'Room' : 'Rooms'}</div>
            <div className="break-words font-display text-3xl font-semibold">
              {roomIds.join(', ')}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2.5 hover:bg-ink/10">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-3">
          <button onClick={onCheckIn} className="btn-primary h-14 text-base">
            <LogIn size={20} /> Check in now
          </button>
          <button
            onClick={onSchedule}
            className="btn-outline h-14 text-base text-ink hover:bg-ink/10"
          >
            <CalendarPlus size={20} /> Schedule a booking
          </button>
        </div>

        <p className="mt-4 text-xs text-muted">
          Check in now starts the stay at the current time. Schedule a booking reserves the room for
          a later date and time.
        </p>
      </div>
    </Modal>
  );
}
