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
        'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ' +
        (view === id ? 'bg-brand text-white' : 'text-ink/70 hover:text-ink')
      }
    >
      {icon} {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-2.5">
        <div className="flex shrink-0 items-center gap-2">
          <img
            src={logo}
            alt=""
            className="h-9 w-auto shrink-0 select-none sm:h-11"
            draggable={false}
          />
          <div className="whitespace-nowrap font-display text-base font-bold leading-tight text-brand sm:text-lg">
            {innName}
          </div>
        </div>

        {role === 'owner' ? (
          <nav className="flex shrink-0 items-center gap-1 rounded-full bg-ink/[0.06] p-1">
            {tab('frontdesk', 'Front Desk', <KeyRound size={15} />)}
            {tab('owner', 'Owner Dashboard', <SettingsIcon size={15} />)}
          </nav>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-ink/[0.06] px-4 py-1.5 text-sm font-semibold text-ink/70">
            <KeyRound size={15} /> Front Desk
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-sm tabular-nums text-muted sm:flex">
            <Clock size={15} />
            {fmtClock(now)}
          </div>
          <button
            onClick={onToggleTheme}
            title="Toggle day / night mode"
            aria-label="Toggle day / night mode"
            className="rounded-full border border-line p-2 text-muted"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={onLogout}
            title="Log out"
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-sm font-semibold text-muted"
          >
            <LogOut size={15} /> <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
