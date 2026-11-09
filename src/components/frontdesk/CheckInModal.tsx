import { AlertTriangle, ArrowLeft, ArrowRight, CalendarPlus, Clock, LogIn, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DURATION_PRESETS, PAYMENT_METHODS } from '../../config/defaults';
import { useNow } from '../../hooks/useNow';
import { findConflict } from '../../lib/bookings';
import { fmtDateTime, fmtMoney } from '../../lib/format';
import { genReference } from '../../lib/ids';
import type { PaymentMethod, Room, Transaction } from '../../types';
import DatePicker from '../pickers/DatePicker';
import NumberWheel from '../pickers/NumberWheel';
import TimePicker from '../pickers/TimePicker';
import Field from '../ui/Field';
import Modal from '../ui/Modal';

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
 * Two short panels instead of one long scrolling form:
 *   1. Guest info  (name, adults, children, rooms)
 *   2. Time & payment
 * Mounted fresh every time it opens, so each booking gets its own reference number.
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
  const now = useNow(isSchedule ? 3_600_000 : 1000);

  const [step, setStep] = useState<1 | 2>(1);
  const [ref] = useState(() => genReference(new Set(txns.map((t) => t.ref))));
  const [guestName, setGuestName] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
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

  // "Check in now" always starts at the current time; a reservation uses the picked date/time.
  const start = isSchedule ? timeIn : now;
  const timeOut = useMemo(
    () => new Date(start.getTime() + hoursNum * 3_600_000),
    [start, hoursNum],
  );

  const toggleRoom = (id: string) =>
    setRoomIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const next = () => {
    if (!guestName.trim()) return setError('Guest name is required.');
    if (roomIds.length === 0) return setError('Select at least one room.');
    setError('');
    setStep(2);
  };

  const submit = () => {
    if (hoursNum <= 0) return setError('Duration must be greater than zero.');

    const startAt = isSchedule ? timeIn : new Date(); // exact moment of confirming
    const endAt = new Date(startAt.getTime() + hoursNum * 3_600_000);

    const conflict = findConflict(txns, roomIds, startAt, endAt);
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
      adults,
      children,
      hours: hoursNum,
      timeIn: startAt.toISOString(),
      timeOut: endAt.toISOString(),
      paymentMethod,
      totalAmount: Number(amount) || 0,
      status: isSchedule ? 'scheduled' : 'active',
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <Modal onClose={onClose} wide label={isSchedule ? 'Schedule a booking' : 'Guest check-in'}>
      {/* header + progress */}
      <div className="border-b border-line px-5 pb-3 pt-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="label">
              {isSchedule ? 'Schedule a booking' : 'Guest registration'} · Step {step} of 2
            </div>
            <div className="font-display text-xl font-semibold sm:text-2xl">
              {step === 1 ? 'Guest info' : 'Time & payment'}
            </div>
            <div className="text-xs tabular-nums text-muted">Ref {ref}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2.5 hover:bg-ink/10">
            <X size={20} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5" aria-hidden>
          <div className="h-1 rounded-full bg-brand" />
          <div className={'h-1 rounded-full ' + (step === 2 ? 'bg-brand' : 'bg-line')} />
        </div>
      </div>

      {/* panel (sized to fit without scrolling; it only scrolls on very small screens) */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
        {step === 1 ? (
          <div className="space-y-4">
            <Field label="Guest Name" htmlFor="guest-name">
              <input
                id="guest-name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Juan Dela Cruz"
                className="field"
                autoComplete="off"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <NumberWheel
                label="Adults"
                value={adults}
                min={1}
                max={20}
                optionLabel={(n) => `${n} adult${n === 1 ? '' : 's'}`}
                onChange={setAdults}
              />
              <NumberWheel
                label="Children"
                value={children}
                min={0}
                max={20}
                optionLabel={(n) => `${n} child${n === 1 ? '' : 'ren'}`}
                onChange={setChildren}
              />
            </div>

            <Field
              label="Room(s)"
              hint={
                isSchedule
                  ? "Any room can be booked ahead — we'll warn you if it clashes with another booking."
                  : undefined
              }
            >
              <div className="flex flex-wrap gap-2">
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
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Duration (hours)" htmlFor="duration">
              <input
                id="duration"
                type="number"
                min={1}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="field tabular-nums"
              />
              <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                {DURATION_PRESETS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(String(h))}
                    className={
                      'min-h-11 rounded-lg border text-sm font-semibold hover:border-brand-bright sm:min-h-9 ' +
                      (hoursNum === h ? 'border-brand bg-brand/10 text-brand' : 'border-line')
                    }
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </Field>

            {isSchedule ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Scheduled Date">
                  <DatePicker value={timeIn} onChange={setTimeIn} />
                </Field>
                <Field label="Scheduled Time">
                  <TimePicker value={timeIn} onChange={setTimeIn} />
                </Field>
              </div>
            ) : (
              <Field label="Time In">
                <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 tabular-nums">
                  <Clock size={16} className="shrink-0 text-brand" />
                  <span>Now · {fmtDateTime(now.toISOString())}</span>
                </div>
              </Field>
            )}

            <div className="rounded-lg bg-ink/[0.04] px-3 py-2 text-sm tabular-nums">
              <span className="text-muted">Time out (auto): </span>
              <span className="font-semibold">{fmtDateTime(timeOut.toISOString())}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment" htmlFor="payment">
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
              <Field label="Total Amount" htmlFor="amount">
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
            </div>
            <div className="-mt-2 text-xs text-muted">
              Suggested: {fmtMoney(suggested)} ({selectedRooms.length} room
              {selectedRooms.length === 1 ? '' : 's'} × {hoursNum}h)
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-3 flex items-start gap-2 text-sm text-overdue-bright">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* buttons */}
      <div className="flex gap-3 border-t border-line px-5 py-3 sm:px-6">
        {step === 1 ? (
          <button onClick={next} className="btn-primary h-12 w-full text-base">
            Next <ArrowRight size={18} />
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                setError('');
                setStep(1);
              }}
              className="btn-outline h-12 px-5"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <button onClick={submit} className="btn-primary h-12 flex-1 text-base">
              {isSchedule ? <CalendarPlus size={18} /> : <LogIn size={18} />}
              {isSchedule ? 'Save Reservation' : 'Confirm Check-In'}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
