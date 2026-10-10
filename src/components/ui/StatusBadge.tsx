import { statusBadgeClasses, statusLabel } from '../../lib/status';
import type { TxnStatus } from '../../types';

export default function StatusBadge({ status }: { status: TxnStatus }) {
  return (
    <span
      className={'rounded-full px-2 py-0.5 text-xs font-semibold ' + statusBadgeClasses(status)}
    >
      {statusLabel(status)}
    </span>
  );
}
