export type Role = 'admin' | 'client' | 'professional';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  emailVerified?: boolean;
  createdAt?: string | null;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string | null;
  tokenType: string;
  user: User;
}

export interface Service {
  id: number;
  name: string;
  category: string;
  duration: number;
  price: number;
  active: boolean;
  image?: string | null;
}

export interface Professional {
  id: number;
  name: string;
  specialty: string;
  scheduleStart: string;
  scheduleEnd: string;
  active: boolean;
}

export type AppointmentStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'expired'
  | 'cancelled'
  | 'rescheduled'
  | 'completed'
  | 'no_show';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled' | 'voided';

export interface AppointmentHistoryItem {
  action: string;
  at: string;
}

export interface Appointment {
  id: number;
  clientUserId?: number | null;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  serviceId: number;
  professionalId: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  paymentStatus?: PaymentStatus;
  paymentDueAt?: string | null;
  depositAmount?: number;
  balanceAmount?: number;
  paidAmount?: number;
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paymentTransactionId?: string | null;
  paymentProvider?: string | null;
  cancelledAt?: string | null;
  notes?: string | null;
  history: AppointmentHistoryItem[];
}

export interface AppointmentPaymentInitResponse {
  appointmentId: number;
  paymentReference: string;
  provider: string;
  amount: number;
  currency: string;
  paymentDueAt?: string | null;
  status: PaymentStatus;
  checkoutUrl?: string | null;
}

export interface CompanyData {
  businessName?: string | null;
  legalName?: string | null;
  nit?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  weekStart?: string | null;
  weekEnd?: string | null;
  satStart?: string | null;
  satEnd?: string | null;
  sunStart?: string | null;
  sunEnd?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  whatsapp?: string | null;
  welcomeMsg?: string | null;
}

export interface Branding {
  spLogo?: string | null;
  landingImages?: {
    section1?: string | null;
    section2?: string | null;
    section3?: string | null;
  };
}
