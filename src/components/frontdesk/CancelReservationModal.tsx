import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { CANCEL_REASONS } from '../../config/defaults';
import { fmtDateTime, fmtMoney } from '../../lib/format';
import type { Transaction } from '../../types';
import Field from '../ui/Field';
import Modal from '../ui/Modal';

export interface CancelDetails {
  reason: string;
  note: string;
  refundAmount: number;
}

interface CancelReservationModalProps {
  txn: Transaction;
  onConfirm: (details: CancelDetails) => void;
  onClose: () => void;
}

/** A reservation can't be cancelled until a reason (and the refund amount) is recorded. */
export default function CancelReservationModal({
  txn,
  onConfirm,
  onClose,
}: CancelReservationModalProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [refund, setRefund] = useState(String(txn.totalAmount));
  const [error, setError] = useState('');

  const submit = () => {
    const refundAmount = Number(refund);
    if (!reason) return setError('Choose a reason for the cancellation / refund.');
    if (reason === 'Other' && !note.trim()) return setError('Please describe the reason.');
    if (!Number.isFinite(refundAmount) || refundAmount < 0) {
      return setError('Enter the refund amount (0 if nothing is refunded).');
    }
    if (refundAmount > txn.totalAmount) {
      return setError(
        `The refund can't be more than the amount paid (${fmtMoney(txn.totalAmount)}).`,
      );
    }
    onConfirm({ reason, note: note.trim(), refundAmount });
  };

  return (
    <Modal onClose={onClose} label="Cancel reservation">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="label">Cancel reservation</div>
          <div className="truncate font-display text-xl font-semibold">{txn.guestName}</div>
          <div className="text-xs tabular-nums text-muted">
            Room {txn.roomIds.join(', ')} · {fmtDateTime(txn.timeIn)} · Paid{' '}
            {fmtMoney(txn.totalAmount)} ({txn.paymentMethod})
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" className="rounded-lg p-2.5 hover:bg-ink/10">
          <X size={20} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <Field label="Reason for cancelling / refund">
          <div role="radiogroup" aria-label="Reason" className="flex flex-wrap gap-2">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={reason === r}
                onClick={() => setReason(r)}
                className={'chip ' + (reason === r ? 'chip-active' : 'hover:border-brand-bright')}
              >
                {r}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label={reason === 'Other' ? 'Describe the reason' : 'Notes (optional)'}
          htmlFor="cancel-note"
        >
          <textarea
            id="cancel-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field resize-none"
          />
        </Field>

        <Field label="Refund amount" htmlFor="refund">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">₱</span>
              <input
                id="refund"
                type="number"
                min={0}
                value={refund}
                onChange={(e) => setRefund(e.target.value)}
                className="field pl-7 tabular-nums"
              />
            </div>
            <button
              type="button"
              onClick={() => setRefund(String(txn.totalAmount))}
              className="btn-outline px-3 text-xs"
            >
              Full
            </button>
            <button
              type="button"
              onClick={() => setRefund('0')}
              className="btn-outline px-3 text-xs"
            >
              None
            </button>
          </div>
        </Field>

        {error && (
          <div role="alert" className="flex items-start gap-2 text-sm text-overdue-bright">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t border-line px-5 py-3">
        <button onClick={onClose} className="btn-outline h-12 flex-1">
          Keep booking
        </button>
        <button
          onClick={submit}
          className="btn h-12 flex-1 bg-overdue font-bold text-white hover:bg-overdue-bright"
        >
          Cancel reservation
        </button>
      </div>
    </Modal>
  );
}
