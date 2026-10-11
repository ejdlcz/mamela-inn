import { Clock, KeyRound, LogOut, Moon, Settings as SettingsIcon, Sun } from 'lucide-react';
import logo from '../../assets/logo.png';
import { useNow } from '../../hooks/useNow';
import { fmtClock } from '../../lib/format';
import type { Role, Theme, View } from '../../types';

interface HeaderProps {
  view: View;
  onViewChange: (v: View) => void;
  innName: string;
  role: Role;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

// Big (44px) touch targets on phones, smaller on desktop.
const roundButton =
  'flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted sm:h-9 sm:w-9';

export default function Header({
  view,
  onViewChange,
  innName,
  role,
  onLogout,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const now = useNow(1000);

  const tab = (id: View, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => onViewChange(id)}
      className={
        'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-semibold transition-colors sm:flex-none sm:px-4 sm:py-1.5 ' +
        (view === id ? 'bg-brand text-white' : 'text-ink/70 hover:text-ink')
      }
    >
      {icon} {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 sm:px-5 sm:py-2.5">
        <div className="order-1 flex min-w-0 items-center gap-2">
          <img
            src={logo}
            alt=""
            className="h-9 w-auto shrink-0 select-none sm:h-11"
            draggable={false}
          />
          <div className="truncate font-display text-base font-bold leading-tight text-brand sm:text-lg">
            {innName}
          </div>
        </div>

        {role === 'owner' ? (
          <nav className="order-3 flex w-full items-center gap-1 rounded-full bg-ink/[0.06] p-1 sm:order-2 sm:w-auto">
            {tab('frontdesk', 'Front Desk', <KeyRound size={16} />)}
            {tab('owner', 'Owner Dashboard', <SettingsIcon size={16} />)}
          </nav>
        ) : (
          <div className="order-2 hidden items-center gap-1.5 rounded-full bg-ink/[0.06] px-4 py-1.5 text-sm font-semibold text-ink/70 sm:flex">
            <KeyRound size={15} /> Front Desk
          </div>
        )}

        <div className="order-2 flex items-center gap-2 sm:order-3 sm:gap-3">
          <div className="hidden items-center gap-2 text-sm tabular-nums text-muted sm:flex">
            <Clock size={15} />
            {fmtClock(now)}
          </div>
          <button
            onClick={onToggleTheme}
            title="Toggle day / night mode"
            aria-label="Toggle day / night mode"
            className={roundButton}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 sm:h-4 sm:w-4" />
            ) : (
              <Moon className="h-5 w-5 sm:h-4 sm:w-4" />
            )}
          </button>
          <button
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
            className={roundButton + ' sm:w-auto sm:gap-1.5 sm:px-3 sm:text-sm sm:font-semibold'}
          >
            <LogOut className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
