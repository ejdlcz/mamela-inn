import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { DEFAULT_ROOMS, DEFAULT_SETTINGS, STORAGE_KEYS } from './config/defaults';
import type { Room, Settings, Transaction } from './types';

type User = ReturnType<typeof userEvent.setup>;

const read = <T,>(key: string): T => JSON.parse(localStorage.getItem(key) ?? 'null') as T;
const storedTxns = () => read<Transaction[]>(STORAGE_KEYS.txns) ?? [];
const storedRooms = () => read<Room[]>(STORAGE_KEYS.rooms);
const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
const next = (user: User) => user.click(screen.getByRole('button', { name: /^next/i }));

async function enterFrontDesk() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /front desk/i }));
  return user;
}

async function signInAsOwner() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /owner/i }));
  await user.type(screen.getByPlaceholderText('Username'), 'owner');
  await user.type(screen.getByPlaceholderText('Password'), '123');
  await user.click(screen.getByRole('button', { name: 'Sign In' }));
  return user;
}

/** Puts a guest in room 101 whose time ran out `outMinutesAgo` minutes ago. */
function seedStay(outMinutesAgo: number, settings?: Partial<Settings>) {
  const ref = 'INN-20300101-1111';
  const stay: Transaction = {
    ref,
    guestName: 'Late Guest',
    roomIds: ['101'],
    adults: 1,
    children: 0,
    hours: 3,
    timeIn: minutesAgo(outMinutesAgo + 180),
    timeOut: minutesAgo(outMinutesAgo),
    paymentMethod: 'Cash',
    totalAmount: 540,
    status: 'active',
    createdAt: minutesAgo(outMinutesAgo + 181),
  };
  const rooms = DEFAULT_ROOMS.map((r) =>
    r.id === '101'
      ? {
          ...r,
          status: 'occupied' as const,
          txnId: ref,
          guestName: 'Late Guest',
          timeOut: stay.timeOut,
        }
      : r,
  );
  localStorage.setItem(STORAGE_KEYS.txns, JSON.stringify([stay]));
  localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms));
  if (settings) {
    localStorage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }),
    );
  }
}

/** Pretend the browser window is phone-sized. */
function stubNarrowScreen() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('max-width: 639px'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe('guest registration panels', () => {
  it('has two panels with Next / Back and records adults and children', async () => {
    const user = await enterFrontDesk();
    await user.click(await screen.findByRole('button', { name: 'Room 101, Vacant' }));
    await user.click(screen.getByRole('button', { name: /check in now/i }));

    expect(screen.getByText(/step 1 of 2/i)).toBeTruthy();
    await next(user); // no name yet
    expect((await screen.findByRole('alert')).textContent).toMatch(/guest name is required/i);

    await user.type(screen.getByLabelText('Guest Name'), 'Family');
    await user.click(screen.getByRole('option', { name: '3 adults' }));
    await user.click(screen.getByRole('option', { name: '2 children' }));
    await next(user);

    expect(screen.getByText(/step 2 of 2/i)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect((screen.getByLabelText('Guest Name') as HTMLInputElement).value).toBe('Family');
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Confirm Check-In' }));

    await screen.findByRole('button', { name: 'Room 101, Occupied' });
    expect(storedTxns()[0]).toMatchObject({ adults: 3, children: 2 });
  });

  it('defaults to 1 adult and 0 children', async () => {
    const user = await enterFrontDesk();
    await user.click(await screen.findByRole('button', { name: 'Room 102, Vacant' }));
    await user.click(screen.getByRole('button', { name: /check in now/i }));
    await user.type(screen.getByLabelText('Guest Name'), 'Solo');
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Confirm Check-In' }));
    await screen.findByRole('button', { name: 'Room 102, Occupied' });
    expect(storedTxns()[0]).toMatchObject({ adults: 1, children: 0 });
  });
});

describe('cancelling a reservation', () => {
  async function scheduleMaria(user: User) {
    await user.click(await screen.findByRole('button', { name: 'Room 105, Vacant' }));
    await user.click(screen.getByRole('button', { name: /schedule a booking/i }));
    await user.type(screen.getByLabelText('Guest Name'), 'Maria');
    await next(user);
    await user.click(screen.getByRole('button', { name: /save reservation/i }));
    const side = await screen.findByRole('complementary', { name: /scheduled bookings/i });
    await within(side).findByText('Maria');
    return side;
  }

  it('asks for a reason and the refund before cancelling', async () => {
    const user = await enterFrontDesk();
    const side = await scheduleMaria(user);

    await user.click(within(side).getByRole('button', { name: /cancel reservation for maria/i }));
    const dialog = await screen.findByRole('dialog', { name: /cancel reservation/i });

    // nothing is cancelled until a reason is chosen
    await user.click(within(dialog).getByRole('button', { name: 'Cancel reservation' }));
    expect((await within(dialog).findByRole('alert')).textContent).toMatch(/choose a reason/i);
    expect(storedTxns()[0].status).toBe('scheduled');

    await user.click(within(dialog).getByRole('radio', { name: 'Customer changed plans' }));
    const refund = within(dialog).getByLabelText('Refund amount');
    await user.clear(refund);
    await user.type(refund, '200');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel reservation' }));

    await waitFor(() => expect(storedTxns()[0].status).toBe('cancelled'));
    expect(storedTxns()[0]).toMatchObject({
      cancelReason: 'Customer changed plans',
      refundAmount: 200,
    });
    expect(storedTxns()[0].cancelledAt).toBeTruthy();
    expect(within(side).queryByText('Maria')).toBeNull();
  });

  it('keeps the booking if you choose "Keep booking"', async () => {
    const user = await enterFrontDesk();
    const side = await scheduleMaria(user);
    await user.click(within(side).getByRole('button', { name: /cancel reservation for maria/i }));
    const dialog = await screen.findByRole('dialog', { name: /cancel reservation/i });
    await user.click(within(dialog).getByRole('button', { name: /keep booking/i }));
    expect(screen.queryByRole('dialog', { name: /cancel reservation/i })).toBeNull();
    expect(storedTxns()[0].status).toBe('scheduled');
  });

  it('needs a description for "Other" and rejects a refund above what was paid', async () => {
    const user = await enterFrontDesk();
    const side = await scheduleMaria(user);
    await user.click(within(side).getByRole('button', { name: /cancel reservation for maria/i }));
    const dialog = await screen.findByRole('dialog', { name: /cancel reservation/i });

    await user.click(within(dialog).getByRole('radio', { name: 'Other' }));
    await user.click(within(dialog).getByRole('button', { name: 'Cancel reservation' }));
    expect((await within(dialog).findByRole('alert')).textContent).toMatch(/describe the reason/i);

    await user.type(within(dialog).getByLabelText('Describe the reason'), 'Typhoon');
    const refund = within(dialog).getByLabelText('Refund amount');
    await user.clear(refund);
    await user.type(refund, '99999');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel reservation' }));
    expect((await within(dialog).findByRole('alert')).textContent).toMatch(/can't be more/i);
    expect(storedTxns()[0].status).toBe('scheduled');
  });
});

describe('overdue grace period', () => {
  it('keeps the guest in the room during the grace period', async () => {
    seedStay(5);
    await enterFrontDesk();
    expect(await screen.findByRole('button', { name: 'Room 101, Overdue' })).toBeTruthy();
    expect(storedTxns()[0].status).toBe('active');
    expect(storedRooms().find((r) => r.id === '101')?.status).toBe('occupied');
  });

  it('removes the guest after the grace period but keeps the room flagged Overdue', async () => {
    seedStay(20); // default grace is 15 minutes
    await enterFrontDesk();
    await screen.findByRole('button', { name: 'Room 101, Overdue' });

    await waitFor(() => expect(storedTxns()[0].status).toBe('completed'));
    expect(storedTxns()[0]).toMatchObject({ autoCheckedOut: true, overstayMinutes: 15 });
    expect(storedTxns()[0].actualTimeOut).toBeTruthy();
    expect(storedRooms().find((r) => r.id === '101')).toMatchObject({
      status: 'vacant',
      overstayRef: 'INN-20300101-1111',
    });
  });

  it('follows the grace period set by the owner', async () => {
    seedStay(20, { graceMinutes: 30 });
    await enterFrontDesk();
    await screen.findByRole('button', { name: 'Room 101, Overdue' });
    expect(storedTxns()[0].status).toBe('active');
  });

  it('records the overstay when the clerk confirms the guest left', async () => {
    seedStay(20);
    const user = await enterFrontDesk();
    await user.click(await screen.findByRole('button', { name: 'Room 101, Overdue' }));
    const dialog = await screen.findByRole('dialog', { name: /room 101 overdue/i });
    await user.click(within(dialog).getByRole('button', { name: /confirm guest left/i }));

    expect(await screen.findByRole('button', { name: 'Room 101, Vacant' })).toBeTruthy();
    await waitFor(() => expect(storedRooms().find((r) => r.id === '101')?.overstayRef).toBeNull());
    expect(storedTxns()[0].overstayMinutes).toBeGreaterThanOrEqual(20);
  });

  it('records the overstay when the room is booked again', async () => {
    seedStay(20);
    const user = await enterFrontDesk();
    await user.click(await screen.findByRole('button', { name: 'Room 101, Overdue' }));
    const dialog = await screen.findByRole('dialog', { name: /room 101 overdue/i });
    await user.click(within(dialog).getByRole('button', { name: /book this room/i }));
    await user.click(await screen.findByRole('button', { name: /check in now/i }));
    await user.type(screen.getByLabelText('Guest Name'), 'Next Guest');
    await next(user);
    await user.click(screen.getByRole('button', { name: 'Confirm Check-In' }));

    expect(await screen.findByRole('button', { name: 'Room 101, Occupied' })).toBeTruthy();
    await waitFor(() => expect(storedRooms().find((r) => r.id === '101')?.overstayRef).toBeNull());
    const old = storedTxns().find((t) => t.ref === 'INN-20300101-1111')!;
    expect(old.overstayMinutes).toBeGreaterThanOrEqual(20);
  });

  it('records how long a guest overstayed when checked out manually', async () => {
    seedStay(8);
    const user = await enterFrontDesk();
    await user.click(await screen.findByRole('button', { name: 'Room 101, Overdue' }));
    await user.click(screen.getByRole('button', { name: /check out guest/i }));
    await screen.findByRole('button', { name: 'Room 101, Vacant' });
    await waitFor(() => expect(storedTxns()[0].status).toBe('completed'));
    expect(storedTxns()[0].overstayMinutes).toBeGreaterThanOrEqual(8);
    expect(storedTxns()[0].autoCheckedOut).toBeFalsy();
  });
});

describe('owner settings & ledger', () => {
  it('lets the owner change the grace period', async () => {
    const user = await signInAsOwner();
    await user.click(await screen.findByRole('button', { name: /owner dashboard/i }));
    await user.click(screen.getByRole('button', { name: /admin settings/i }));
    const grace = await screen.findByLabelText(/overdue grace period/i);
    await user.clear(grace);
    await user.type(grace, '25');
    await user.click(screen.getByRole('button', { name: /save settings/i }));
    await waitFor(() => expect(read<Settings>(STORAGE_KEYS.settings).graceMinutes).toBe(25));
  });

  it('shows cancellation reasons, refunds and overstay in the ledger', async () => {
    localStorage.setItem(
      STORAGE_KEYS.txns,
      JSON.stringify([
        {
          ref: 'INN-20300101-2222',
          guestName: 'Cancelled Carl',
          roomIds: ['103'],
          adults: 2,
          children: 1,
          hours: 3,
          timeIn: minutesAgo(-600),
          timeOut: minutesAgo(-780),
          paymentMethod: 'GCash',
          totalAmount: 540,
          status: 'cancelled',
          createdAt: minutesAgo(60),
          cancelReason: 'Customer changed plans',
          refundAmount: 300,
          cancelledAt: minutesAgo(30),
        },
        {
          ref: 'INN-20300101-3333',
          guestName: 'Overstay Olga',
          roomIds: ['104'],
          adults: 1,
          children: 0,
          hours: 3,
          timeIn: minutesAgo(400),
          timeOut: minutesAgo(220),
          actualTimeOut: minutesAgo(205),
          paymentMethod: 'Cash',
          totalAmount: 540,
          status: 'completed',
          createdAt: minutesAgo(401),
          overstayMinutes: 15,
          autoCheckedOut: true,
        },
      ]),
    );
    const user = await signInAsOwner();
    await user.click(await screen.findByRole('button', { name: /owner dashboard/i }));

    expect(await screen.findByText(/customer changed plans · refund/i)).toBeTruthy();
    expect(screen.getByText('2 adults, 1 child')).toBeTruthy();
    expect(screen.getByText('15 min')).toBeTruthy();
    expect(screen.getByText('Auto checked out')).toBeTruthy();
  });
});

describe('owner area on a phone', () => {
  it('is a settings-style menu: pages open one at a time with a Back button', async () => {
    stubNarrowScreen();
    const user = await signInAsOwner();
    await user.click(await screen.findByRole('button', { name: /owner dashboard/i }));

    // top menu
    expect(screen.getByRole('button', { name: /master ledger/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /reports & export/i })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /admin settings/i }));

    // admin settings menu
    expect(screen.getByRole('button', { name: /rooms & hourly rates/i })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /overdue & grace period/i }));

    // one page, one topic
    expect(screen.getByLabelText(/overdue grace period/i)).toBeTruthy();
    expect(screen.queryByLabelText('Property name')).toBeNull();

    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByRole('button', { name: /weekly report emails/i })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByRole('button', { name: /master ledger/i })).toBeTruthy();
  });

  it('lists rooms as cards instead of a wide table', async () => {
    stubNarrowScreen();
    const user = await signInAsOwner();
    await user.click(await screen.findByRole('button', { name: /owner dashboard/i }));
    await user.click(screen.getByRole('button', { name: /admin settings/i }));
    await user.click(screen.getByRole('button', { name: /rooms & hourly rates/i }));
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('Room 101')).toBeTruthy();
    expect(screen.getByRole('button', { name: /add room/i })).toBeTruthy();
  });
});
