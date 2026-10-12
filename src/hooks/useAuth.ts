import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../config/defaults';
import { verifyOwner } from '../lib/auth';
import { safeRemove } from '../lib/storage';
import type { Role } from '../types';

/**
 * Who is signed in. This is deliberately kept in memory only: opening the app,
 * reloading it, or coming back to a closed/restored tab always starts on the
 * landing page. (Inactivity sign-out lives in useInactivityLogout.)
 */
export function useAuth() {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    // Older versions remembered the sign-in in browser storage — clear that leftover.
    safeRemove(STORAGE_KEYS.role);

    // Some phone browsers restore a closed page from their back/forward cache
    // with all its state. Treat that as "opened again" and show the landing page.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setRole(null);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const loginFrontDesk = useCallback(() => setRole('frontdesk'), []);

  const loginOwner = useCallback(async (username: string, password: string) => {
    if (!(await verifyOwner(username, password))) return false;
    setRole('owner');
    return true;
  }, []);

  const logout = useCallback(() => setRole(null), []);

  return { role, loginFrontDesk, loginOwner, logout };
}
