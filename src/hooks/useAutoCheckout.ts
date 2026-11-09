import { useEffect, useRef } from 'react';
import { autoCheckoutPatch, dueForAutoCheckout } from '../lib/overdue';
import type { InnData } from './useInnData';

/**
 * Removes guests automatically once their grace period (Owner settings) after the
 * time-out has passed. The stay is closed, the room is freed for booking, and the room
 * keeps an "Overdue" flag until someone confirms the guest really left.
 *
 * It runs in whatever device has the app open (every 15 s, and when the app comes
 * back to the screen). If nobody had it open, it catches up on the next start and
 * records the checkout at the exact end of the grace period.
 */
export function useAutoCheckout(data: InnData) {
  const latest = useRef(data);
  latest.current = data;
  const busy = useRef(false);

  useEffect(() => {
    if (!data.ready) return;

    const run = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const d = latest.current;
        const grace = d.settings.graceMinutes;
        for (const txn of dueForAutoCheckout(d.txns, grace, Date.now())) {
          await d.updateTxn(autoCheckoutPatch(txn, grace));
          for (const id of txn.roomIds) {
            const room = latest.current.rooms.find((r) => r.id === id);
            if (!room) continue;
            await d.saveRoom({
              ...room,
              status: 'vacant',
              txnId: null,
              guestName: txn.guestName,
              timeOut: txn.timeOut,
              overstayRef: txn.ref,
            });
          }
        }
      } catch {
        /* try again on the next tick */
      } finally {
        busy.current = false;
      }
    };

    void run();
    const timer = setInterval(run, 15_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void run();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [data.ready]);
}
