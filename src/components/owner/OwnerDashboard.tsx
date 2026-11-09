import { FileSpreadsheet, List, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import { useIsNarrow } from '../../hooks/useMediaQuery';
import type { InnData } from '../../hooks/useInnData';
import AdminSettings, { ADMIN_SECTIONS, type SectionId } from './AdminSettings';
import Ledger from './Ledger';
import { MenuList, PageHeader } from './MobileMenu';
import Reports from './Reports';

type Tab = 'ledger' | 'reports' | 'admin';

const TABS: { id: Tab; label: string; hint: string; Icon: typeof List }[] = [
  { id: 'ledger', label: 'Master Ledger', hint: 'Every stay, reservation and refund', Icon: List },
  {
    id: 'reports',
    label: 'Reports & Export',
    hint: 'Last 7 days, spreadsheet download',
    Icon: FileSpreadsheet,
  },
  {
    id: 'admin',
    label: 'Admin Settings',
    hint: 'Rooms, rates, grace period, emails',
    Icon: SettingsIcon,
  },
];

export default function OwnerDashboard({ data }: { data: InnData }) {
  const narrow = useIsNarrow();
  const [tab, setTab] = useState<Tab>('ledger');

  /* ---- phones: a settings-style list of pages (nothing to scroll sideways) ---- */
  const [page, setPage] = useState<Tab | null>(null);
  const [section, setSection] = useState<SectionId | null>(null);

  if (narrow) {
    if (page === null) {
      return (
        <div>
          <h2 className="mb-3 font-display text-2xl font-semibold">Owner Dashboard</h2>
          <MenuList
            items={TABS.map(({ id, label, hint, Icon }) => ({
              id,
              label,
              hint,
              icon: <Icon size={20} />,
              onClick: () => setPage(id),
            }))}
          />
        </div>
      );
    }

    if (page === 'admin' && section === null) {
      return (
        <div>
          <PageHeader title="Admin Settings" onBack={() => setPage(null)} />
          <MenuList
            items={ADMIN_SECTIONS.map((s) => ({
              id: s.id,
              label: s.label,
              hint: s.hint,
              icon: s.icon,
              onClick: () => setSection(s.id),
            }))}
          />
        </div>
      );
    }

    if (page === 'admin' && section !== null) {
      const current = ADMIN_SECTIONS.find((s) => s.id === section)!;
      return (
        <div>
          <PageHeader title={current.label} onBack={() => setSection(null)} />
          <AdminSettings data={data} section={section} />
        </div>
      );
    }

    return (
      <div>
        <PageHeader title={TABS.find((t) => t.id === page)!.label} onBack={() => setPage(null)} />
        {page === 'ledger' && <Ledger txns={data.txns} />}
        {page === 'reports' && <Reports txns={data.txns} settings={data.settings} />}
      </div>
    );
  }

  /* ---- tablets / desktops: tabs ---- */
  return (
    <div>
      <div className="mb-6 flex gap-1.5 border-b border-line">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={
              '-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ' +
              (tab === id
                ? 'border-brand-bright text-brand-bright'
                : 'border-transparent text-muted hover:text-brand-bright')
            }
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'ledger' && <Ledger txns={data.txns} />}
      {tab === 'reports' && <Reports txns={data.txns} settings={data.settings} />}
      {tab === 'admin' && <AdminSettings data={data} />}
    </div>
  );
}
