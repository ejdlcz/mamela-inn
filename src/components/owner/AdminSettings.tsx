import { Check, Clock, Home, Mail, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useIsNarrow } from '../../hooks/useMediaQuery';
import type { InnData } from '../../hooks/useInnData';
import { useToast } from '../../hooks/useToast';
import type { Room, Settings } from '../../types';
import Field from '../ui/Field';

export type SectionId = 'rooms' | 'property' | 'overdue' | 'emails';

/** The settings groups. On phones each one is its own page; on bigger screens all show together. */
export const ADMIN_SECTIONS: { id: SectionId; label: string; hint: string; icon: ReactNode }[] = [
  {
    id: 'rooms',
    label: 'Rooms & hourly rates',
    hint: 'Add, remove, change prices',
    icon: <Home size={20} />,
  },
  {
    id: 'property',
    label: 'Property & rates',
    hint: 'Name, tagline, default rate, tax',
    icon: <Home size={20} />,
  },
  {
    id: 'overdue',
    label: 'Overdue & grace period',
    hint: 'When guests are removed automatically',
    icon: <Clock size={20} />,
  },
  {
    id: 'emails',
    label: 'Weekly report emails',
    hint: 'Who receives the report',
    icon: <Mail size={20} />,
  },
];

const EMAIL = /^\S+@\S+\.\S+$/;

const statusPill = (occupied: boolean) => (
  <span
    className={
      'rounded-full px-2 py-0.5 text-xs font-semibold ' +
      (occupied ? 'bg-occupied/20 text-occupied-bright' : 'bg-vacant/20 text-vacant-bright')
    }
  >
    {occupied ? 'Occupied' : 'Vacant'}
  </span>
);

interface AdminSettingsProps {
  data: InnData;
  /** Show only this group (phone pages). Leave out to show everything (desktop). */
  section?: SectionId;
}

export default function AdminSettings({ data, section }: AdminSettingsProps) {
  const toast = useToast();
  const narrow = useIsNarrow();
  const { rooms, txns, settings } = data;

  const [form, setForm] = useState<Settings>(settings);
  const [newRoom, setNewRoom] = useState({ number: '', rate: String(settings.defaultRate) });
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => setForm(settings), [settings]);

  const show = (id: SectionId) => !section || section === id;
  const heading = (text: string) =>
    !section && <h3 className="mb-3 font-display text-lg font-semibold">{text}</h3>;
  const patch = (p: Partial<Settings>) => setForm((f) => ({ ...f, ...p }));
  const showsForm = show('property') || show('overdue') || show('emails');

  const save = async () => {
    try {
      await data.saveSettings(form);
      toast('Settings saved.');
    } catch {
      toast('Could not save settings.', 'error');
    }
  };

  /* ---- recipients ---- */
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

  /* ---- rooms ---- */
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
        overstayRef: null,
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

  const rateInput = (r: Room, className: string) => (
    <input
      key={`${r.id}-${r.rate}`}
      type="number"
      defaultValue={r.rate}
      onBlur={(e) => updateRate(r, e.target.value)}
      className={className}
      aria-label={`Hourly rate for room ${r.number}`}
    />
  );

  return (
    <div className="space-y-8">
      {/* ---------------- rooms ---------------- */}
      {show('rooms') && (
        <section>
          {heading('Rooms & hourly rates')}

          {narrow ? (
            <div className="space-y-2.5">
              {rooms.map((r) => (
                <div key={r.id} className="card p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-xl font-semibold">Room {r.number}</div>
                    {statusPill(r.status === 'occupied')}
                  </div>
                  <div className="mt-2 flex items-end gap-3">
                    <Field label="Hourly rate (₱)" className="flex-1">
                      {rateInput(r, 'field tabular-nums')}
                    </Field>
                    <button
                      onClick={() => removeRoom(r)}
                      aria-label={`Remove room ${r.number}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line text-overdue-bright"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="card space-y-2 border-dashed p-3.5">
                <div className="label">Add a room</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newRoom.number}
                    onChange={(e) => setNewRoom((n) => ({ ...n, number: e.target.value }))}
                    placeholder="Room no."
                    className="field"
                    aria-label="New room number"
                  />
                  <input
                    type="number"
                    value={newRoom.rate}
                    onChange={(e) => setNewRoom((n) => ({ ...n, rate: e.target.value }))}
                    className="field tabular-nums"
                    aria-label="New room hourly rate"
                  />
                </div>
                <button onClick={addRoom} className="btn-primary h-11 w-full">
                  <Plus size={16} /> Add room
                </button>
              </div>
            </div>
          ) : (
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
                        <td className={cell}>{rateInput(r, small)}</td>
                        <td className={cell}>{statusPill(r.status === 'occupied')}</td>
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
          )}
        </section>
      )}

      {/* ---------------- settings form (property / overdue / emails) ---------------- */}
      {showsForm && (
        <section>
          {heading('System settings')}
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            {show('property') && (
              <>
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
              </>
            )}

            {show('overdue') && (
              <Field
                label="Overdue grace period (minutes)"
                htmlFor="grace"
                className="sm:col-span-2"
                hint="After a guest's time is up they show as Overdue. Once this many minutes have passed they are removed from the room automatically (the room keeps showing Overdue until you confirm they left), and the time they overstayed is saved in the ledger."
              >
                <input
                  id="grace"
                  type="number"
                  min={0}
                  max={240}
                  value={form.graceMinutes}
                  onChange={(e) =>
                    patch({
                      graceMinutes: Math.max(
                        0,
                        Math.min(240, Math.round(Number(e.target.value) || 0)),
                      ),
                    })
                  }
                  className="field tabular-nums sm:max-w-40"
                />
              </Field>
            )}

            {show('emails') && (
              <>
                <Field
                  label="Weekly report recipient email"
                  htmlFor="owner-email"
                  className="sm:col-span-2"
                >
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
                    <button
                      type="button"
                      onClick={addEmail}
                      className="btn-primary h-11 shrink-0 sm:h-auto"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  {form.recipientEmails.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.recipientEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line py-1 pl-3 pr-1.5 text-xs font-semibold"
                        >
                          <span className="truncate">{email}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${email}`}
                            onClick={() =>
                              patch({
                                recipientEmails: form.recipientEmails.filter((e) => e !== email),
                              })
                            }
                            className="rounded-full p-1.5 text-overdue-bright hover:bg-overdue/20"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </Field>
              </>
            )}
          </div>

          <button onClick={save} className="btn-primary mt-4 h-12 w-full sm:h-auto sm:w-auto">
            <Check size={16} /> Save Settings
          </button>
        </section>
      )}
    </div>
  );
}
