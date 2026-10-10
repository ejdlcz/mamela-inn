import { useCallback, useState } from 'react';
import { STORAGE_KEYS } from '../config/defaults';
import { verifyOwner } from '../lib/auth';
import { safeGet, safeRemove, safeSet } from '../lib/storage';
import type { Role } from '../types';

function storedRole(): Role | null {
  const v = safeGet(STORAGE_KEYS.role);
  return v === 'frontdesk' || v === 'owner' ? v : null;
}

/** Who is signed in on this device (remembered across reloads). */
export function useAuth() {
  const [role, setRole] = useState<Role | null>(storedRole);

  const loginFrontDesk = useCallback(() => {
    safeSet(STORAGE_KEYS.role, 'frontdesk');
    setRole('frontdesk');
  }, []);

  const loginOwner = useCallback(async (username: string, password: string) => {
    if (!(await verifyOwner(username, password))) return false;
    safeSet(STORAGE_KEYS.role, 'owner');
    setRole('owner');
    return true;
  }, []);

  const logout = useCallback(() => {
    safeRemove(STORAGE_KEYS.role);
    setRole(null);
  }, []);

  return { role, loginFrontDesk, loginOwner, logout };
}
