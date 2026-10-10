import type { TxnStatus } from '../types';

export const statusLabel = (status: TxnStatus) =>
  ({ active: 'Active', scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' })[
    status
  ];

/** Tailwind classes for the little status pill in tables. */
export const statusBadgeClasses = (status: TxnStatus) =>
  ({
    active: 'bg-occupied/20 text-occupied-bright',
    scheduled: 'bg-brand/20 text-brand-bright',
    completed: 'bg-vacant/20 text-vacant-bright',
    cancelled: 'bg-overdue/20 text-overdue-bright',
  })[status];
