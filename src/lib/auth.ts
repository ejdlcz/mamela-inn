/**
 * Owner sign-in. Today this is a simple username/password pair from the build
 * environment — a convenience gate, NOT real security (see README).
 *
 * Everything that checks credentials goes through verifyOwner(), so upgrading
 * to Supabase Auth later means changing only this function.
 */
const OWNER_USERNAME = import.meta.env.VITE_OWNER_USERNAME || 'owner';
const OWNER_PASSWORD = import.meta.env.VITE_OWNER_PASSWORD || '123';

/** True while the temporary owner/123 login is active (we show a hint for it). */
export const usingDefaultOwnerLogin = !import.meta.env.VITE_OWNER_PASSWORD;
export const DEFAULT_LOGIN_HINT = { username: 'owner', password: '123' };

export async function verifyOwner(username: string, password: string): Promise<boolean> {
  return username.trim() === OWNER_USERNAME && password === OWNER_PASSWORD;
}
