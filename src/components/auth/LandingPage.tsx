import {
  AlertTriangle,
  ChevronRight,
  KeyRound,
  Lock,
  Moon,
  Settings as SettingsIcon,
  Sun,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import logo from '../../assets/logo.png';
import { DEFAULT_LOGIN_HINT, usingDefaultOwnerLogin } from '../../lib/auth';
import type { Theme } from '../../types';

interface LandingPageProps {
  innName: string;
  tagline: string;
  theme: Theme;
  onToggleTheme: () => void;
  onFrontDesk: () => void;
  onOwnerLogin: (username: string, password: string) => Promise<boolean>;
}

const choiceButton =
  'flex w-full items-center gap-4 rounded-2xl border-2 border-line bg-surface p-5 text-left transition-all hover:-translate-y-0.5';
const iconBox = 'rounded-xl bg-brand/10 p-3 text-brand';

export default function LandingPage({
  innName,
  tagline,
  theme,
  onToggleTheme,
  onFrontDesk,
  onOwnerLogin,
}: LandingPageProps) {
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await onOwnerLogin(username, password);
    setError(ok ? '' : 'Incorrect username or password.');
  };

  return (
    // Fixed to the screen: this page never scrolls. (Only while the owner sign-in
    // form is open do we allow scrolling, as a safety net on very small screens.)
    <div
      className={
        'relative flex h-dvh flex-col bg-base px-5 text-ink ' +
        (ownerOpen ? 'overflow-y-auto py-6' : 'overflow-hidden')
      }
    >
      <button
        onClick={onToggleTheme}
        aria-label="Toggle day / night mode"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-line sm:right-5 sm:top-5"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="m-auto w-full max-w-md animate-rise text-center">
        <img
          src={logo}
          alt={`${innName} logo`}
          className={'mx-auto select-none sm:w-72 ' + (ownerOpen ? 'w-40' : 'w-64')}
          draggable={false}
        />
        <h1 className="-mt-2 font-display text-4xl font-bold text-brand sm:text-5xl">{innName}</h1>
        {tagline && (
          <p className="mt-1 text-sm font-semibold tracking-wide text-muted">{tagline}</p>
        )}

        <div className="mt-8 grid gap-4 sm:mt-10">
          {/* Hidden on phones while the owner form is open so the form fits the screen */}
          <div className={ownerOpen ? 'hidden sm:block' : ''}>
            <button onClick={onFrontDesk} className={choiceButton}>
              <div className={iconBox}>
                <KeyRound size={24} />
              </div>
              <div className="flex-1 font-display text-lg font-semibold">Front Desk</div>
              <ChevronRight size={20} className="text-muted" />
            </button>
          </div>

          {!ownerOpen ? (
            <button onClick={() => setOwnerOpen(true)} className={choiceButton}>
              <div className={iconBox}>
                <SettingsIcon size={24} />
              </div>
              <div className="flex-1 font-display text-lg font-semibold">Owner</div>
              <ChevronRight size={20} className="text-muted" />
            </button>
          ) : (
            <form
              onSubmit={submit}
              className="animate-rise rounded-2xl border-2 border-line bg-surface p-5 text-left"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-brand/10 p-2 text-brand">
                  <Lock size={16} />
                </div>
                <div className="font-display text-base font-semibold">Owner sign-in</div>
              </div>

              {usingDefaultOwnerLogin && (
                <div className="mb-3 rounded-lg border border-brand bg-brand/10 px-3 py-2 text-xs text-brand">
                  Temporary access — username <strong>{DEFAULT_LOGIN_HINT.username}</strong>,
                  password <strong>{DEFAULT_LOGIN_HINT.password}</strong>
                </div>
              )}

              <div className="space-y-3">
                <input
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                  className="field text-sm"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="field text-sm"
                />
              </div>

              {error && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-overdue-bright">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="btn-outline flex-1"
                  onClick={() => {
                    setOwnerOpen(false);
                    setError('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
