import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { STORAGE_KEYS } from './config/defaults';

const storedTxns = () =>
  JSON.parse(localStorage.getItem(STORAGE_KEYS.txns) ?? '[]') as { ref: string; status: string }[];

async function enterFrontDesk() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /front desk/i }));
  return user;
}

type User = ReturnType<typeof userEvent.setup>;

async function checkIn(user: User, room: string, guest: string) {
  await user.click(await screen.findByRole('button', { name: `Room ${room}, Vacant` }));
  await user.click(screen.getByRole('button', { name: /check in now/i }));
  await user.type(screen.getByLabelText('Guest Name'), guest);
  await user.click(screen.getByRole('button', { name: 'Confirm Check-In' }));
}

describe('landing page', () => {
  it('shows only Front Desk and Owner, plus the temporary login hint after opening Owner', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('button', { name: /front desk/i })).toBeTruthy();
    expect(screen.queryByText(/no login needed/i)).toBeNull();
    await user.click(screen.getByRole('button', { name: /owner/i }));
    expect(screen.getByText(/temporary access/i)).toBeTruthy();
  });

  it('rejects a wrong owner password', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /owner/i }));
    await user.type(screen.getByPlaceholderText('Username'), 'owner');
    await user.type(screen.getByPlaceholderText('Password'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText(/incorrect username or password/i)).toBeTruthy();
  });
});

describe('front desk', () => {
  it('gives front-desk staff no way into the owner dashboard', async () => {
    await enterFrontDesk();
    expect(await screen.findByRole('button', { name: 'Room 101, Vacant' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /owner dashboard/i })).toBeNull();
  });

  it('checks a guest in, then out', async () => {
    const user = await enterFrontDesk();
    await checkIn(user, '101', 'Juan Dela Cruz');

    const occupied = await screen.findByRole('button', { name: 'Room 101, Occupied' });
    expect(within(occupied).getByText('Juan Dela Cruz')).toBeTruthy();

    await user.click(occupied);
    await user.click(screen.getByRole('button', { name: /check out guest/i }));
    expect(await screen.findByRole('button', { name: 'Room 101, Vacant' })).toBeTruthy();
    expect(storedTxns()[0].status).toBe('completed');
  });

  it('gives every check-in its own new reference number', async () => {
    const user = await enterFrontDesk();
    await checkIn(user, '101', 'First Guest');
    await screen.findByRole('button', { name: 'Room 101, Occupied' });
    await checkIn(user, '102', 'Second Guest');
    await screen.findByRole('button', { name: 'Room 102, Occupied' });

    const txns = storedTxns();
    expect(txns).toHaveLength(2);
    expect(txns[0].ref).not.toBe(txns[1].ref);
    expect(txns.every((t) => /^INN-\d{8}-\d{4}$/.test(t.ref))).toBe(true);
  });

  it('shows the two booking options when a vacant room is tapped', async () => {
    const user = await enterFrontDesk();
    await user.click(await screen.findByRole('button', { name: 'Room 103, Vacant' }));
    expect(screen.getByRole('button', { name: /check in now/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /schedule a booking/i })).toBeTruthy();
  });

  it('has no standalone "Schedule a Booking" button in the toolbar', async () => {
    await enterFrontDesk();
    await screen.findByRole('button', { name: 'Room 101, Vacant' });
    expect(screen.queryByRole('button', { name: /schedule a booking/i })).toBeNull();
  });

  it('check in now has no date/time pickers: it always uses the current time', async () => {
    const user = await enterFrontDesk();
    await user.click(await screen.findByRole('button', { name: 'Room 101, Vacant' }));
    await user.click(screen.getByRole('button', { name: /check in now/i }));
    expect(screen.getByText(/^now ·/i)).toBeTruthy();
    expect(screen.queryByText('Scheduled Date')).toBeNull();

    const before = Date.now();
    await user.type(screen.getByLabelText('Guest Name'), 'Walk-in');
    await user.click(screen.getByRole('button', { name: 'Confirm Check-In' }));
    await screen.findByRole('button', { name: 'Room 101, Occupied' });
    const [txn] = JSON.parse(localStorage.getItem(STORAGE_KEYS.txns) ?? '[]');
    expect(Math.abs(new Date(txn.timeIn).getTime() - before)).toBeLessThan(10_000);
  });

  it('schedule a booking still lets you pick a date and time', async () => {
    const user = await enterFrontDesk();
    await user.click(await screen.findByRole('button', { name: 'Room 103, Vacant' }));
    await user.click(screen.getByRole('button', { name: /schedule a booking/i }));
    expect(screen.getByText('Scheduled Date')).toBeTruthy();
    expect(screen.getByText('Scheduled Time')).toBeTruthy();
  });

  it('books several selected rooms together', async () => {
    const user = await enterFrontDesk();
    await user.click(await screen.findByRole('button', { name: /multi-room select mode/i }));
    await user.click(screen.getByRole('button', { name: 'Room 101, Vacant' }));
    await user.click(screen.getByRole('button', { name: 'Room 102, Vacant' }));
    await user.click(screen.getByRole('button', { name: /book selected \(2\)/i }));
    await user.click(screen.getByRole('button', { name: /check in now/i }));
    await user.type(screen.getByLabelText('Guest Name'), 'Group');
    await user.click(screen.getByRole('button', { name: 'Confirm Check-In' }));

    expect(await screen.findByRole('button', { name: 'Room 101, Occupied' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Room 102, Occupied' })).toBeTruthy();
    expect(storedTxns()).toHaveLength(1);
  });

  it('blocks a reservation that overlaps an existing stay in the same room', async () => {
    const user = await enterFrontDesk();
    await checkIn(user, '101', 'Juan');
    await screen.findByRole('button', { name: 'Room 101, Occupied' });

    await user.click(screen.getByRole('button', { name: 'Room 102, Vacant' }));
    await user.click(screen.getByRole('button', { name: /schedule a booking/i }));
    await user.type(screen.getByLabelText('Guest Name'), 'Maria');
    await user.click(screen.getByRole('button', { name: '101' })); // add the busy room
    await user.click(screen.getByRole('button', { name: /save reservation/i }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/already booked for Juan/);
    expect(storedTxns()).toHaveLength(1);
  });

  it('saves a reservation without occupying the room, lists it at the side, then checks it in', async () => {
    const user = await enterFrontDesk();
    await user.click(await screen.findByRole('button', { name: 'Room 105, Vacant' }));
    await user.click(screen.getByRole('button', { name: /schedule a booking/i }));
    await user.type(screen.getByLabelText('Guest Name'), 'Maria');
    await user.click(screen.getByRole('button', { name: /save reservation/i }));

    const side = await screen.findByRole('complementary', { name: /scheduled bookings/i });
    expect(await within(side).findByText('Maria')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Room 105, Vacant' })).toBeTruthy();

    await user.click(within(side).getByRole('button', { name: /check in now/i }));
    expect(await screen.findByRole('button', { name: 'Room 105, Occupied' })).toBeTruthy();
    expect(storedTxns()[0].status).toBe('active');
  });
});

describe('owner', () => {
  it('signs in with the temporary login and sees the ledger', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /owner/i }));
    await user.type(screen.getByPlaceholderText('Username'), 'owner');
    await user.type(screen.getByPlaceholderText('Password'), '123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await checkIn(user, '101', 'Ledger Guest');
    await screen.findByRole('button', { name: 'Room 101, Occupied' });

    await user.click(screen.getByRole('button', { name: /owner dashboard/i }));
    expect(await screen.findByText('Ledger Guest')).toBeTruthy();
    expect(screen.getByText(/1 of 1 transactions shown/i)).toBeTruthy();
  });
});
