export type RoomStatus = 'vacant' | 'occupied';
/** scheduled = pre-booked for later, cancelled = reservation dropped */
export type TxnStatus = 'active' | 'scheduled' | 'completed' | 'cancelled';
export type PaymentMethod = 'Cash' | 'GCash' | 'Maya' | 'Credit Card' | 'Bank Transfer';
export type Role = 'frontdesk' | 'owner';
export type View = 'frontdesk' | 'owner';
export type Theme = 'light' | 'dark';

export interface Room {
  id: string;
  number: string;
  /** hourly rate in PHP */
  rate: number;
  status: RoomStatus;
  /** reference of the active transaction occupying this room */
  txnId: string | null;
  guestName: string | null;
  /** ISO time the current stay ends */
  timeOut: string | null;
}

export interface Transaction {
  /** unique reference, INN-YYYYMMDD-XXXX */
  ref: string;
  guestName: string;
  roomIds: string[];
  hours: number;
  /** ISO */
  timeIn: string;
  /** ISO */
  timeOut: string;
  /** ISO, set when the guest actually checks out */
  actualTimeOut?: string | null;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  status: TxnStatus;
  /** ISO */
  createdAt: string;
}

export interface Settings {
  innName: string;
  tagline: string;
  ownerEmail: string;
  recipientEmails: string[];
  taxRate: number;
  defaultRate: number;
}
