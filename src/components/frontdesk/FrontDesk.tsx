import { CalendarPlus, LayoutGrid, LogIn } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNow } from '../../hooks/useNow';
import { useToast } from '../../hooks/useToast';
import type { InnData } from '../../hooks/useInnData';
import { findConflict } from '../../lib/bookings';
import { fmtDateTime } from '../../lib/format';
import { roomGridColumns } from '../../lib/layout';
import type { Room, Transaction } from '../../types';
import CheckInModal from './CheckInModal';
import GuestInfoModal from './GuestInfoModal';
import ReservationsList from './ReservationsList';
import RoomCard from './RoomCard';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Please try again.');

export default function FrontDesk({ data }: { data: InnData }) {
  const toast = useToast();
  const now = useNow(1000);
  const { rooms, txns, settings } = data;

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [booking, setBooking] = useState<null | {
    mode: 'checkin' | 'schedule';
    roomIds: string[];
  }>(null);
  const [infoRoomId, setInfoRoomId] = useState<string | null>(null);

  const activeTxnByRoom = useMemo(() => {
    const map: Record<string, Transaction> = {};
    for (const t of txns) {
      if (t.status === 'active') t.roomIds.forEach((id) => (map[id] = t));
    }
    return map;
  }, [txns]);

  const reservations = useMemo(
    () =>
      txns
        .filter((t) => t.status === 'scheduled')
        .sort((a, b) => +new Date(a.timeIn) - +new Date(b.timeIn)),
    [txns],
  );

  const infoRoom = infoRoomId ? rooms.find((r) => r.id === infoRoomId) : undefined;

  /* ---- room state helpers ------------------------------------------------ */
  const occupy = (txn: Transaction, roomIds: string[]) =>
    Promise.all(
      roomIds.map((id) => {
        const room = rooms.find((r) => r.id === id);
        if (!room) return Promise.resolve();
        return data.saveRoom({
          ...room,
          status: 'occupied',
          txnId: txn.ref,
          guestName: txn.guestName,
          timeOut: txn.timeOut,
        });
      }),
    );

  const vacate = (roomIds: string[]) =>
    Promise.all(
      roomIds.map((id) => {
        const room = rooms.find((r) => r.id === id);
        if (!room) return Promise.resolve();
        return data.saveRoom({
          ...room,
          status: 'vacant',
          txnId: null,
          guestName: null,
          timeOut: null,
        });
      }),
    );

  /* ---- actions ------------------------------------------------------------ */
  const openRoom = (room: Room) => {
    if (room.status === 'occupied') setInfoRoomId(room.id);
    else setBooking({ mode: 'checkin', roomIds: [room.id] });
  };

  const toggleSelect = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const confirmBooking = async (txn: Transaction) => {
    try {
      await data.createTxn(txn);
      if (txn.status === 'scheduled') {
        toast(`Reservation saved for ${txn.guestName} — ${fmtDateTime(txn.timeIn)} · ${txn.ref}`);
      } else {
        await occupy(txn, txn.roomIds);
        setSelected([]);
        setSelectMode(false);
        toast(`Checked in ${txn.guestName} — ${txn.roomIds.join(', ')} · ${txn.ref}`);
      }
      setBooking(null);
    } catch (e) {
      toast(`Could not save the booking. ${errMsg(e)}`, 'error');
    }
  };

  const checkout = async (txn: Transaction) => {
    try {
      await data.updateTxn({
        ...txn,
        status: 'completed',
        actualTimeOut: new Date().toISOString(),
      });
      await vacate(txn.roomIds);
      setInfoRoomId(null);
      toast(`Room ${txn.roomIds.join(', ')} checked out. Now vacant.`);
    } catch (e) {
      toast(`Checkout failed. ${errMsg(e)}`, 'error');
    }
  };

  const activateReservation = async (txn: Transaction) => {
    const busy = txn.roomIds.filter((id) => rooms.find((r) => r.id === id)?.status === 'occupied');
    if (busy.length) {
      return toast(`Room ${busy.join(', ')} is currently occupied — can't check in yet.`, 'error');
    }
    const timeIn = new Date();
    const timeOut = new Date(timeIn.getTime() + txn.hours * 3_600_000);
    const conflict = findConflict(txns, txn.roomIds, timeIn, timeOut, txn.ref);
    if (conflict) {
      return toast(
        `Room ${conflict.roomId} is booked for ${conflict.guestName} at ${fmtDateTime(conflict.timeIn)} — shorten the stay or pick another room.`,
        'error',
      );
    }
    try {
      const next: Transaction = {
        ...txn,
        timeIn: timeIn.toISOString(),
        timeOut: timeOut.toISOString(),
        status: 'active',
      };
      await data.updateTxn(next);
      await occupy(next, next.roomIds);
      toast(`${txn.guestName} checked in from reservation — ${txn.roomIds.join(', ')}.`);
    } catch (e) {
      toast(`Could not check in this reservation. ${errMsg(e)}`, 'error');
    }
  };

  const cancelReservation = async (txn: Transaction) => {
    try {
      await data.updateTxn({ ...txn, status: 'cancelled' });
      toast(`Reservation for ${txn.guestName} cancelled.`);
    } catch (e) {
      toast(`Could not cancel the reservation. ${errMsg(e)}`, 'error');
    }
  };

  /** Checks that `roomId` is vacant and free for the rest of this stay. */
  const roomAvailableFor = (txn: Transaction, roomId: string) => {
    const target = rooms.find((r) => r.id === roomId);
    if (!target || target.status !== 'vacant') {
      toast('That room is no longer vacant.', 'error');
      return null;
    }
    const conflict = findConflict(txns, [roomId], new Date(), new Date(txn.timeOut), txn.ref);
    if (conflict) {
      toast(
        `Room ${roomId} is reserved for ${conflict.guestName} from ${fmtDateTime(conflict.timeIn)}.`,
        'error',
      );
      return null;
    }
    return target;
  };

  const changeRoom = async (txn: Transaction, fromId: string, toId: string) => {
    if (!roomAvailableFor(txn, toId)) return;
    try {
      const next = { ...txn, roomIds: txn.roomIds.map((id) => (id === fromId ? toId : id)) };
      await data.updateTxn(next);
      await vacate([fromId]);
      await occupy(next, [toId]);
      setInfoRoomId(null);
      toast(`Moved ${txn.guestName} from Room ${fromId} to Room ${toId}.`);
    } catch (e) {
      toast(`Room change failed. ${errMsg(e)}`, 'error');
    }
  };

  const addRoom = async (txn: Transaction, roomId: string) => {
    if (!roomAvailableFor(txn, roomId)) return;
    try {
      const next = { ...txn, roomIds: [...txn.roomIds, roomId] };
      await data.updateTxn(next);
      await occupy(next, [roomId]);
      toast(`Room ${roomId} added to ${txn.guestName}'s stay.`);
    } catch (e) {
      toast(`Could not add the room. ${errMsg(e)}`, 'error');
    }
  };

  /* ---- render ------------------------------------------------------------- */
  const vacantCount = rooms.filter((r) => r.status === 'vacant').length;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-vacant-bright" />
            {vacantCount} vacant
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-occupied-bright" />
            {rooms.length - vacantCount} occupied
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectMode && selected.length > 0 && (
            <button
              onClick={() => setBooking({ mode: 'checkin', roomIds: selected })}
              className="btn-primary"
            >
              <LogIn size={16} /> Check In Selected ({selected.length})
            </button>
          )}
          <button
            onClick={() => setBooking({ mode: 'schedule', roomIds: [] })}
            className="btn-outline"
          >
            <CalendarPlus size={16} /> Schedule a Booking
          </button>
          <button
            onClick={() => {
              setSelectMode((s) => !s);
              setSelected([]);
            }}
            className={selectMode ? 'btn-primary' : 'btn-outline'}
          >
            <LayoutGrid size={16} /> Multi-Room Select Mode {selectMode ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No rooms are set up yet. The owner can add rooms in Owner Dashboard → Admin Settings.
        </div>
      ) : (
        <div
          className="grid gap-3 sm:gap-4"
          style={{ gridTemplateColumns: roomGridColumns(rooms.length) }}
        >
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              now={now}
              selectMode={selectMode}
              selected={selected.includes(room.id)}
              onToggleSelect={toggleSelect}
              onOpen={openRoom}
            />
          ))}
        </div>
      )}

      <ReservationsList
        reservations={reservations}
        now={now}
        onCheckIn={activateReservation}
        onCancel={cancelReservation}
      />

      {infoRoom && (
        <GuestInfoModal
          key={infoRoom.id}
          room={infoRoom}
          txn={activeTxnByRoom[infoRoom.id] ?? null}
          rooms={rooms}
          onClose={() => setInfoRoomId(null)}
          onCheckout={checkout}
          onChangeRoom={changeRoom}
          onAddRoom={addRoom}
        />
      )}

      {booking && (
        <CheckInModal
          mode={booking.mode}
          initialRoomIds={booking.roomIds}
          rooms={rooms}
          txns={txns}
          defaultRate={settings.defaultRate}
          onClose={() => setBooking(null)}
          onConfirm={confirmBooking}
        />
      )}
    </div>
  );
}
