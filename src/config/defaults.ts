import type { PaymentMethod, Room, Settings } from '../types';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'GCash',
  'Maya',
  'Credit Card',
  'Bank Transfer',
];

/** Sign out (back to the landing page) after this many minutes without any touch/click/key. */
export const INACTIVITY_MINUTES = 30;
/** Sign out if the app was in the background / screen off for this long. 0 = never. */
export const BACKGROUND_MINUTES = 5;

/** Quick-pick buttons in the check-in form */
export const DURATION_PRESETS = [3, 6, 12, 22, 24];

export const DEFAULT_RATE = 180;

export const DEFAULT_ROOMS: Room[] = Array.from({ length: 10 }, (_, i) => ({
  id: String(101 + i),
  number: String(101 + i),
  rate: DEFAULT_RATE,
  status: 'vacant' as const,
  txnId: null,
  guestName: null,
  timeOut: null,
}));

export const DEFAULT_SETTINGS: Settings = {
  innName: "Mamela's Inn",
  tagline: 'At Home Tayo',
  ownerEmail: 'owner@mamelasinn.example',
  recipientEmails: [],
  taxRate: 0,
  defaultRate: DEFAULT_RATE,
};

/** localStorage keys. Rooms/txns/settings are only used in local mode. */
export const STORAGE_KEYS = {
  rooms: 'mamela_rooms_v1',
  txns: 'mamela_txns_v1',
  settings: 'mamela_settings_v1',
  role: 'mamela_role',
  theme: 'mamela_theme',
} as const;
