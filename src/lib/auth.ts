/**
 * Owner sign-in. A convenience gate built from the build environment — NOT real
 * security (see README -> "Security notes"). Everything that checks credentials
 * goes through verifyOwner(), so upgrading to Supabase Auth later means changing
 * only this file.
 *
 * HOW ACCOUNTS ARE CONFIGURED (VITE_OWNER_USERNAME / VITE_OWNER_PASSWORD):
 *
 *   one account  ->  VITE_OWNER_USERNAME = mamela
 *                    VITE_OWNER_PASSWORD = secret1
 *
 *   several      ->  leave VITE_OWNER_USERNAME empty and set
 *                    VITE_OWNER_PASSWORD = mamela:secret1,joy:secret2,ben:secret3
 *                    (username:password pairs separated by commas;
 *                     passwords can't contain a comma; usernames can't contain ":")
 *
 *   nothing set  ->  temporary login owner / 123 (and a hint is shown)
 */
export interface OwnerAccount {
  username: string;
  password: string;
}

const DEFAULT_ACCOUNT: OwnerAccount = { username: 'owner', password: '123' };

/** Turns the two environment values into the list of allowed owner accounts. */
export function parseOwnerAccounts(usernameVar = '', passwordVar = ''): OwnerAccount[] {
  const username = usernameVar.trim();

  if (!passwordVar) return [DEFAULT_ACCOUNT];
  if (username) return [{ username, password: passwordVar }];

  // No single username given: "name:pass,name2:pass2" list in the password value.
  if (passwordVar.includes(':')) {
    const accounts: OwnerAccount[] = [];
    for (const entry of passwordVar.split(',')) {
      const i = entry.indexOf(':');
      const name = entry.slice(0, i).trim();
      const pass = entry.slice(i + 1).trim();
      if (i > 0 && name && pass) accounts.push({ username: name, password: pass });
    }
    if (accounts.length > 0) return accounts;
  }

  // Only a password was given: keep the original behaviour (username "owner").
  return [{ username: 'owner', password: passwordVar }];
}

const ACCOUNTS = parseOwnerAccounts(
  import.meta.env.VITE_OWNER_USERNAME,
  import.meta.env.VITE_OWNER_PASSWORD,
);

/** True while the temporary owner/123 login is active (we show a hint for it). */
export const usingDefaultOwnerLogin = !import.meta.env.VITE_OWNER_PASSWORD;
export const DEFAULT_LOGIN_HINT = { username: 'owner', password: '123' };

export async function verifyOwner(username: string, password: string): Promise<boolean> {
  const name = username.trim().toLowerCase();
  return ACCOUNTS.some((a) => a.username.toLowerCase() === name && a.password === password);
}
