import { useEffect, useRef } from 'react';

export type SignOutReason = 'inactive' | 'background';

interface Options {
  /** Only watch while someone is signed in. */
  active: boolean;
  /** Minutes without any touch / click / key press before signing out. */
  inactivityMinutes: number;
  /** Minutes the app may sit in the background before signing out (0 = never). */
  backgroundMinutes: number;
  onTimeout: (reason: SignOutReason) => void;
}

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'];

/**
 * Signs the user out after a period of inactivity, or when the app was left in
 * the background for a while (phones pause timers in the background, so the
 * clock is re-checked the moment the app becomes visible again).
 */
export function useInactivityLogout({
  active,
  inactivityMinutes,
  backgroundMinutes,
  onTimeout,
}: Options) {
  const callback = useRef(onTimeout);
  callback.current = onTimeout;

  useEffect(() => {
    if (!active) return;

    const inactiveLimit = inactivityMinutes * 60_000;
    const backgroundLimit = backgroundMinutes * 60_000;
    let lastActivity = Date.now();
    let hiddenAt: number | null = null;

    const bump = () => {
      lastActivity = Date.now();
    };
    const checkInactive = () => {
      if (Date.now() - lastActivity >= inactiveLimit) callback.current('inactive');
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      const away = hiddenAt === null ? 0 : Date.now() - hiddenAt;
      hiddenAt = null;
      if (backgroundLimit > 0 && away >= backgroundLimit) callback.current('background');
      else checkInactive();
    };

    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, bump, { passive: true, capture: true }),
    );
    document.addEventListener('visibilitychange', onVisibility);
    const timer = setInterval(checkInactive, 10_000);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, bump, { capture: true }));
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(timer);
    };
  }, [active, inactivityMinutes, backgroundMinutes]);
}
