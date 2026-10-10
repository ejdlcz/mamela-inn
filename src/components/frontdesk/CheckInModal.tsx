import { AlertTriangle, CalendarPlus, LogIn, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DURATION_PRESETS, PAYMENT_METHODS } from '../../config/defaults';
import { findConflict } from '../../lib/bookings';
import { fmtDateTime, fmtMoney } from '../../lib/format';
import { genReference } from '../../lib/ids';
import type { PaymentMethod, Room, Transaction } from '../../types';
import Field from '../ui/Field';
import Modal from '../ui/Modal';
import DatePicker from '../pickers/DatePicker';
import TimePicker from '../pickers/TimePicker';

interface CheckInModalProps {
  /** 'checkin' = guest is here now. 'schedule' = reserve for a later date. */
  mode: 'checkin' | 'schedule';
  initialRoomIds: string[];
  rooms: Room[];
  txns: Transaction[];
  defaultRate: number;
  onClose: () => void;
  onConfirm: (txn: Transaction) => void;
}

/**
 * Mounted fresh every time it opens, so each booking gets its own new
 * reference number and a clean form.
 */
export default function CheckInModal({
  mode,
  initialRoomIds,
  rooms,
  txns,
  defaultRate,
  onClose,
  onConfirm,
}: CheckInModalProps) {
  const isSchedule = mode === 'schedule';

  const [ref] = useState(() => genReference(new Set(txns.map((t) => t.ref))));
  const [guestName, setGuestName] = useState('');
  const [roomIds, setRoomIds] = useState<string[]>(initialRoomIds);
  const [hours, setHours] = useState('3');
  const [timeIn, setTimeIn] = useState(() => new Date());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amount, setAmount] = useState('0');
  const [amountEdited, setAmountEdited] = useState(false);
  const [error, setError] = useState('');

  const hoursNum = Number(hours) || 0;
  const selectedRooms = rooms.filter((r) => roomIds.includes(r.id));
  const suggested =
    selectedRooms.reduce((sum, r) => sum + (Number(r.rate) || defaultRate), 0) * hoursNum;

  // Keep the amount in sync with rooms × hours until the clerk types their own.
  useEffect(() => {
    if (!amountEdited) setAmount(String(suggested));
  }, [suggested, amountEdited]);

  const timeOut = useMemo(
    () => new Date(timeIn.getTime() + hoursNum * 3_600_000),
    [timeIn, hoursNum],
  );

  const toggleRoom = (id: string) =>
    setRoomIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const submit = () => {
    if (!guestName.trim()) return setError('Guest name is required.');
    if (roomIds.length === 0) return setError('Select at least one room.');
    if (hoursNum <= 0) return setError('Duration must be greater than zero.');

    const conflict = findConflict(txns, roomIds, timeIn, timeOut);
    if (conflict) {
      return setError(
        `Room ${conflict.roomId} is already booked for ${conflict.guestName} ` +
          `(${fmtDateTime(conflict.timeIn)} – ${fmtDateTime(conflict.timeOut)}). Pick a different room or time.`,
      );
    }

    setError('');
    onConfirm({
      ref,
      guestName: guestName.trim(),
      roomIds,
      hours: hoursNum,
      timeIn: timeIn.toISOString(),
      timeOut: timeOut.toISOString(),
      paymentMethod,
      totalAmount: Number(amount) || 0,
      status: isSchedule ? 'scheduled' : 'active',
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <Modal onClose={onClose} wide label={isSchedule ? 'Schedule a booking' : 'Guest check-in'}>
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-start justify-between border-b border-line px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div>
            <div className="label">{isSchedule ? 'New Reservation' : 'New Check-In'}</div>
            <div className="font-display text-2xl font-semibold">
              {isSchedule ? 'Schedule a Booking' : 'Guest Registration'}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-ink/10">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <Field label="Reference Number">
            <div className="rounded-lg border border-line bg-brand/10 px-3 py-2 font-display text-lg font-semibold tabular-nums">
              {ref}
            </div>
          </Field>

          <Field label="Guest Name" htmlFor="guest-name">
            <input
              id="guest-name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Juan Dela Cruz"
              className="field"
            />
          </Field>

          <Field
            label="Room(s) Selected"
            hint={
              isSchedule
                ? "Any room can be booked ahead — we'll warn you if it clashes with another booking."
                : undefined
            }
          >
            <div className="mt-2 flex flex-wrap gap-2">
              {rooms.map((r) => {
                const active = roomIds.includes(r.id);
                const disabled = !isSchedule && r.status === 'occupied' && !active;
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleRoom(r.id)}
                    className={
                      'chip ' +
                      (active ? 'chip-active' : 'hover:border-brand-bright') +
                      (disabled ? ' cursor-not-allowed opacity-30' : '')
                    }
                  >
                    {r.number}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Duration (hours)" htmlFor="duration">
              <input
                id="duration"
                type="number"
                min={1}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="field tabular-nums"
              />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(String(h))}
                    className="rounded-md border border-line px-2 py-1 text-xs hover:border-brand-bright"
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Payment Method" htmlFor="payment">
              <select
                id="payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="field"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m} className="text-black">
                    {m}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={isSchedule ? 'Scheduled Date' : 'Date In'}>
              <DatePicker value={timeIn} onChange={setTimeIn} />
            </Field>
            <Field label={isSchedule ? 'Scheduled Time' : 'Time In'}>
              <TimePicker value={timeIn} onChange={setTimeIn} />
            </Field>
          </div>

          <Field label="Date & Time Out (auto)">
            <div className="rounded-lg border border-line px-3 py-2.5 tabular-nums text-muted">
              {fmtDateTime(timeOut.toISOString())}
            </div>
          </Field>

          <Field
            label="Total Payment Amount"
            htmlFor="amount"
            hint={`Suggested: ${fmtMoney(suggested)} (${selectedRooms.length} room${
              selectedRooms.length === 1 ? '' : 's'
            } × ${hoursNum}h)`}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">₱</span>
              <input
                id="amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountEdited(true);
                }}
                className="field pl-7 tabular-nums"
              />
            </div>
          </Field>

          {error && (
            <div role="alert" className="flex items-start gap-2 text-sm text-overdue-bright">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button onClick={submit} className="btn-primary w-full py-3">
            {isSchedule ? <CalendarPlus size={18} /> : <LogIn size={18} />}
            {isSchedule ? 'Save Reservation' : 'Confirm Check-In'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
