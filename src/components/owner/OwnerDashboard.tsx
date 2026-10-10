import { FileSpreadsheet, List, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import type { InnData } from '../../hooks/useInnData';
import AdminSettings from './AdminSettings';
import Ledger from './Ledger';
import Reports from './Reports';

type Tab = 'ledger' | 'reports' | 'admin';

const TABS: { id: Tab; label: string; Icon: typeof List }[] = [
  { id: 'ledger', label: 'Master Ledger', Icon: List },
  { id: 'reports', label: 'Reports & Export', Icon: FileSpreadsheet },
  { id: 'admin', label: 'Admin Settings', Icon: SettingsIcon },
];

export default function OwnerDashboard({ data }: { data: InnData }) {
  const [tab, setTab] = useState<Tab>('ledger');

  return (
    <div>
      <div className="mb-6 flex gap-1.5 overflow-x-auto border-b border-line">
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
