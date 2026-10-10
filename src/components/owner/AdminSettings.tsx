import { Check, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import type { InnData } from '../../hooks/useInnData';
import type { Room, Settings } from '../../types';
import Field from '../ui/Field';

const EMAIL = /^\S+@\S+\.\S+$/;

export default function AdminSettings({ data }: { data: InnData }) {
  const toast = useToast();
  const { rooms, txns, settings } = data;

  const [form, setForm] = useState<Settings>(settings);
  const [newRoom, setNewRoom] = useState({ number: '', rate: String(settings.defaultRate) });
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => setForm(settings), [settings]);

  const patch = (p: Partial<Settings>) => setForm((f) => ({ ...f, ...p }));

  const save = async () => {
    try {
      await data.saveSettings(form);
      toast('Settings saved.');
    } catch {
      toast('Could not save settings.', 'error');
    }
  };

  /* ---- recipients --------------------------------------------------------- */
  const addEmail = () => {
    const email = newEmail.trim();
    if (!email) return;
    if (!EMAIL.test(email)) return toast('Enter a valid email address.', 'error');
    if (email === form.ownerEmail || form.recipientEmails.includes(email)) {
      return toast('That email is already added.', 'error');
    }
    patch({ recipientEmails: [...form.recipientEmails, email] });
    setNewEmail('');
  };

  /* ---- rooms --------------------------------------------------------------- */
  const updateRate = async (room: Room, value: string) => {
    const rate = Number(value) || 0;
    if (rate === room.rate) return;
    try {
      await data.saveRoom({ ...room, rate });
    } catch {
      toast('Could not update the rate.', 'error');
    }
  };

  const removeRoom = async (room: Room) => {
    if (room.status === 'occupied') return toast('Cannot remove an occupied room.', 'error');
    const hasUpcoming = txns.some((t) => t.status === 'scheduled' && t.roomIds.includes(room.id));
    if (hasUpcoming) {
      return toast(`Room ${room.number} has upcoming reservations — cancel them first.`, 'error');
    }
    try {
      await data.deleteRoom(room.id);
      toast(`Room ${room.number} removed.`);
    } catch {
      toast('Could not remove the room.', 'error');
    }
  };

  const addRoom = async () => {
    const number = newRoom.number.trim();
    if (!number) return toast('Enter a room number.', 'error');
    if (rooms.some((r) => r.id === number))
      return toast('That room number already exists.', 'error');
    try {
      await data.saveRoom({
        id: number,
        number,
        rate: Number(newRoom.rate) || settings.defaultRate,
        status: 'vacant',
        txnId: null,
        guestName: null,
        timeOut: null,
      });
      setNewRoom({ number: '', rate: String(settings.defaultRate) });
      toast(`Room ${number} added.`);
    } catch {
      toast('Could not add the room.', 'error');
    }
  };

  const cell = 'px-4 py-2.5';
  const small =
    'w-24 rounded-md border border-line bg-transparent px-2 py-1 tabular-nums outline-none focus-visible:border-brand';

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 font-display text-lg font-semibold">Rooms &amp; hourly rates</h3>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand/10 text-left text-muted">
                  <th className={cell + ' font-semibold'}>Room #</th>
                  <th className={cell + ' font-semibold'}>Hourly rate (₱)</th>
                  <th className={cell + ' font-semibold'}>Status</th>
                  <th className={cell} />
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className={cell + ' font-semibold'}>{r.number}</td>
                    <td className={cell}>
                      <input
                        key={`${r.id}-${r.rate}`}
                        type="number"
                        defaultValue={r.rate}
                        onBlur={(e) => updateRate(r, e.target.value)}
                        className={small}
                        aria-label={`Hourly rate for room ${r.number}`}
                      />
                    </td>
                    <td className={cell}>
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-xs font-semibold ' +
                          (r.status === 'occupied'
                            ? 'bg-occupied/20 text-occupied-bright'
                            : 'bg-vacant/20 text-vacant-bright')
                        }
                      >
                        {r.status === 'occupied' ? 'Occupied' : 'Vacant'}
                      </span>
                    </td>
                    <td className={cell + ' text-right'}>
                      <button
                        onClick={() => removeRoom(r)}
                        aria-label={`Remove room ${r.number}`}
                        className="rounded-md p-1.5 text-overdue-bright hover:bg-overdue/20"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-line">
                  <td className={cell}>
                    <input
                      value={newRoom.number}
                      onChange={(e) => setNewRoom((n) => ({ ...n, number: e.target.value }))}
                      placeholder="e.g. 111"
                      className={small}
                      aria-label="New room number"
                    />
                  </td>
                  <td className={cell}>
                    <input
                      type="number"
                      value={newRoom.rate}
                      onChange={(e) => setNewRoom((n) => ({ ...n, rate: e.target.value }))}
                      className={small}
                      aria-label="New room hourly rate"
                    />
                  </td>
                  <td />
                  <td className={cell + ' text-right'}>
                    <button onClick={addRoom} className="btn-primary px-3 py-1.5 text-xs">
                      <Plus size={13} /> Add Room
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg font-semibold">System settings</h3>
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <Field label="Property name" htmlFor="inn-name">
            <input
              id="inn-name"
              value={form.innName}
              onChange={(e) => patch({ innName: e.target.value })}
              className="field"
            />
          </Field>
          <Field label="Tagline" htmlFor="tagline">
            <input
              id="tagline"
              value={form.tagline}
              onChange={(e) => patch({ tagline: e.target.value })}
              className="field"
            />
          </Field>
          <Field label="Default hourly rate (₱)" htmlFor="default-rate">
            <input
              id="default-rate"
              type="number"
              value={form.defaultRate}
              onChange={(e) => patch({ defaultRate: Number(e.target.value) })}
              className="field tabular-nums"
            />
          </Field>
          <Field label="Tax rate (%)" htmlFor="tax-rate">
            <input
              id="tax-rate"
              type="number"
              value={form.taxRate}
              onChange={(e) => patch({ taxRate: Number(e.target.value) })}
              className="field tabular-nums"
            />
          </Field>
          <Field label="Weekly report recipient email" htmlFor="owner-email">
            <input
              id="owner-email"
              type="email"
              value={form.ownerEmail}
              onChange={(e) => patch({ ownerEmail: e.target.value })}
              className="field"
            />
          </Field>

          <Field label="Additional recipients" htmlFor="new-email" className="sm:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail();
                  }
                }}
                placeholder="another.email@example.com"
                className="field flex-1"
              />
              <button type="button" onClick={addEmail} className="btn-primary shrink-0">
                <Plus size={14} /> Add
              </button>
            </div>
            {form.recipientEmails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.recipientEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line py-1 pl-3 pr-1.5 text-xs font-semibold"
                  >
                    {email}
                    <button
                      type="button"
                      aria-label={`Remove ${email}`}
                      onClick={() =>
                        patch({ recipientEmails: form.recipientEmails.filter((e) => e !== email) })
                      }
                      className="rounded-full p-0.5 text-overdue-bright hover:bg-overdue/20"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>
        </div>

        <button onClick={save} className="btn-primary mt-4">
          <Check size={16} /> Save Settings
        </button>
      </section>
    </div>
  );
}
