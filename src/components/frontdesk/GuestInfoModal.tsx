import { ArrowLeftRight, Clock, LogOut, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useNow } from '../../hooks/useNow';
import { fmtDateTime, fmtMoney, pad2, remaining } from '../../lib/format';
import type { Room, Transaction } from '../../types';
import Modal from '../ui/Modal';

interface GuestInfoModalProps {
  room: Room;
  txn: Transaction | null;
  rooms: Room[];
  onClose: () => void;
  onCheckout: (txn: Transaction) => void;
  onChangeRoom: (txn: Transaction, fromId: string, toId: string) => void;
  onAddRoom: (txn: Transaction, roomId: string) => void;
}

const pick = (active: boolean) =>
  'chip py-1 ' + (active ? 'border-vacant-bright bg-vacant text-white' : '');

export default function GuestInfoModal({
  room,
  txn,
  rooms,
  onClose,
  onCheckout,
  onChangeRoom,
  onAddRoom,
}: GuestInfoModalProps) {
  const now = useNow(1000);
  const [panel, setPanel] = useState<null | 'change' | 'add'>(null);
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);

  const openPanel = (next: 'change' | 'add') => {
    setPanel((p) => (p === next ? null : next));
    setFromId(null);
    setToId(null);
  };

  const vacant = rooms.filter((r) => r.status === 'vacant');
  const { overdue, h, m } = remaining(txn ? new Date(txn.timeOut).getTime() - now.getTime() : 0);

  const detail = (label: string, value: string) => (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );

  return (
    <Modal onClose={onClose} label={`Room ${room.number}`}>
      <div className="overflow-y-auto p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="label">Room</div>
            <div className="font-display text-3xl font-semibold">{room.number}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-ink/10">
            <X size={18} />
          </button>
        </div>

        {!txn ? (
          <div className="text-sm text-muted">No active transaction found for this room.</div>
        ) : (
          <div className="space-y-4">
            <div
              className={
                'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ' +
                (overdue
                  ? 'bg-overdue/15 text-overdue-bright'
                  : 'bg-occupied/15 text-occupied-bright')
              }
            >
              <Clock size={16} />
              {overdue ? `Overdue by ${h}h ${pad2(m)}m` : `${h}h ${pad2(m)}m remaining`}
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {detail('Reference #', txn.ref)}
              {detail('Guest name', txn.guestName)}
              {detail('Rooms', txn.roomIds.join(', '))}
              {detail('Duration', `${txn.hours} hrs`)}
              {detail('Time in', fmtDateTime(txn.timeIn))}
              {detail('Time out', fmtDateTime(txn.timeOut))}
              {detail('Payment method', txn.paymentMethod)}
              {detail('Total paid', fmtMoney(txn.totalAmount))}
            </dl>

            <div className="flex gap-2">
              <button
                onClick={() => openPanel('change')}
                className={
                  'btn-outline flex-1 ' + (panel === 'change' ? 'border-brand text-brand' : '')
                }
              >
                <ArrowLeftRight size={15} /> Change Room
              </button>
              <button
                onClick={() => openPanel('add')}
                className={
                  'btn-outline flex-1 ' + (panel === 'add' ? 'border-brand text-brand' : '')
                }
              >
                <Plus size={15} /> Add Room
              </button>
            </div>

            {panel === 'change' && (
              <div className="space-y-3 rounded-lg border border-line p-3">
                <div>
                  <div className="label mb-1.5">Move guest out of</div>
                  <div className="flex flex-wrap gap-1.5">
                    {txn.roomIds.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFromId(id)}
                        className={'chip py-1 ' + (fromId === id ? 'chip-active' : '')}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="label mb-1.5">Move into (vacant)</div>
                  {vacant.length === 0 ? (
                    <div className="text-xs text-muted">No vacant rooms right now.</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {vacant.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setToId(r.id)}
                          className={pick(toId === r.id)}
                        >
                          {r.number}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  disabled={!fromId || !toId}
                  onClick={() => fromId && toId && onChangeRoom(txn, fromId, toId)}
                  className="btn-primary w-full"
                >
                  Confirm Room Change
                </button>
              </div>
            )}

            {panel === 'add' && (
              <div className="space-y-3 rounded-lg border border-line p-3">
                <div className="label">Add a vacant room to this stay</div>
                {vacant.length === 0 ? (
                  <div className="text-xs text-muted">No vacant rooms right now.</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {vacant.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setToId(r.id)}
                        className={pick(toId === r.id)}
                      >
                        {r.number}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  disabled={!toId}
                  onClick={() => {
                    if (!toId) return;
                    onAddRoom(txn, toId);
                    setPanel(null);
                    setToId(null);
                  }}
                  className="btn-primary w-full"
                >
                  Confirm Add Room
                </button>
              </div>
            )}

            <button onClick={() => onCheckout(txn)} className="btn-success mt-2 w-full py-3">
              <LogOut size={18} /> Check Out Guest
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
