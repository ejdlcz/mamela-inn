import { useState } from 'react';
import LandingPage from './components/auth/LandingPage';
import FrontDesk from './components/frontdesk/FrontDesk';
import Header from './components/layout/Header';
import OwnerDashboard from './components/owner/OwnerDashboard';
import { useAuth } from './hooks/useAuth';
import { useInnData } from './hooks/useInnData';
import { useTheme } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import type { View } from './types';

function Shell() {
  const data = useInnData();
  const { role, loginFrontDesk, loginOwner, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<View>('frontdesk');

  if (!role) {
    return (
      <LandingPage
        innName={data.settings.innName}
        tagline={data.settings.tagline}
        theme={theme}
        onToggleTheme={toggleTheme}
        onFrontDesk={() => {
          setView('frontdesk');
          loginFrontDesk();
        }}
        onOwnerLogin={async (u, p) => {
          const ok = await loginOwner(u, p);
          if (ok) setView('frontdesk');
          return ok;
        }}
      />
    );
  }

  // Front-desk staff can never reach the owner dashboard, even via stale state.
  const activeView: View = role === 'owner' ? view : 'frontdesk';

  // On a portrait phone the Front Desk screen is fixed to the screen height (no page
  // scrolling); the owner dashboard still scrolls normally.
  const fixedOnPhone = activeView === 'frontdesk';

  return (
    <div
      className={
        'flex min-h-screen flex-col bg-base text-ink ' +
        (fixedOnPhone ? 'phone:h-dvh phone:min-h-0 phone:overflow-hidden' : '')
      }
    >
      <Header
        view={activeView}
        onViewChange={setView}
        innName={data.settings.innName}
        role={role}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-6 phone:min-h-0 phone:px-3 phone:py-3">
        {data.error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-overdue-bright bg-overdue/10 px-4 py-3 text-sm text-overdue-bright"
          >
            <span>Couldn't reach the database: {data.error}</span>
            <button onClick={() => void data.reload()} className="btn-outline px-3 py-1 text-xs">
              Retry
            </button>
          </div>
        )}

        {!data.ready ? (
          <div className="py-24 text-center text-muted">Loading front desk…</div>
        ) : activeView === 'frontdesk' ? (
          <FrontDesk data={data} />
        ) : (
          <OwnerDashboard data={data} />
        )}
      </main>

      <footer
        className={
          'mx-auto w-full max-w-7xl px-5 pb-6 text-xs text-muted ' +
          (fixedOnPhone ? 'phone:hidden' : '')
        }
      >
        {data.mode === 'supabase'
          ? 'Connected to Supabase — changes sync live across all devices.'
          : "Local mode — data is saved in this browser only and isn't shared between devices. Add your Supabase keys to .env to sync (see README)."}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
