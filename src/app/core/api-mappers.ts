import { environment } from '../../environments/environment';
import {
  Appointment,
  AppointmentHistoryItem,
  AppointmentPaymentInitResponse,
  Branding,
  CompanyData,
  Professional,
  Service,
  User,
} from './models';

type AnyRecord = any;

const clean = (obj: Record<string, unknown>): AnyRecord => {
  const entries = Object.entries(obj).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as AnyRecord;
};

const apiOrigin = (() => {
  try {
    return new URL(environment.apiUrl).origin;
  } catch {
    return '';
  }
})();

const resolveAssetUrl = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }
  if (value.startsWith('/')) {
    return apiOrigin ? `${apiOrigin}${value}` : value;
  }
  return value;
};

export const mapUserFromApi = (data: AnyRecord): User => ({
  id: data.id,
  email: data.email,
  name: data.name,
  phone: data.phone ?? null,
  role: data.role,
  emailVerified: data.email_verified ?? data.emailVerified ?? true,
  createdAt: data.created_at ?? data.createdAt ?? null,
});

export const mapUserToApi = (payload: Partial<User> & { password?: string }): AnyRecord =>
  clean({
    email: payload.email,
    name: payload.name,
    phone: payload.phone ?? undefined,
    role: payload.role,
    password: payload.password,
  });

export const mapServiceFromApi = (data: AnyRecord): Service => ({
  id: data.id,
  name: data.name,
  category: data.category,
  duration: data.duration,
  price: data.price,
  active: data.active ?? true,
  image: resolveAssetUrl(data.image ?? null),
});

export const mapServiceToApi = (payload: Partial<Service>): AnyRecord =>
  clean({
    name: payload.name,
    category: payload.category,
    duration: payload.duration,
    price: payload.price,
    active: payload.active,
    image: payload.image ?? undefined,
  });

export const mapProfessionalFromApi = (data: AnyRecord): Professional => ({
  id: data.id,
  name: data.name,
  specialty: data.specialty,
  scheduleStart: data.schedule_start ?? data.scheduleStart,
  scheduleEnd: data.schedule_end ?? data.scheduleEnd,
  active: data.active ?? true,
});

export const mapProfessionalToApi = (payload: Partial<Professional>): AnyRecord =>
  clean({
    name: payload.name,
    specialty: payload.specialty,
    schedule_start: payload.scheduleStart,
    schedule_end: payload.scheduleEnd,
    active: payload.active,
  });

const mapHistoryItem = (item: AnyRecord): AppointmentHistoryItem => ({
  action: item.action,
  at: item.at,
});

export const mapAppointmentFromApi = (data: AnyRecord): Appointment => ({
  id: data.id,
  clientUserId: data.client_user_id ?? data.clientUserId ?? null,
  clientName: data.client_name ?? data.clientName,
  clientEmail: data.client_email ?? data.clientEmail,
  clientPhone: data.client_phone ?? data.clientPhone ?? null,
  serviceId: data.service_id ?? data.serviceId,
  professionalId: data.professional_id ?? data.professionalId,
  date: data.date,
  time: data.time,
  status: data.status,
  paymentStatus: data.payment_status ?? data.paymentStatus ?? 'pending',
  paymentDueAt: data.payment_due_at ?? data.paymentDueAt ?? null,
  depositAmount: Number(data.deposit_amount ?? data.depositAmount ?? 0),
  balanceAmount: Number(data.balance_amount ?? data.balanceAmount ?? 0),
  paidAmount: Number(data.paid_amount ?? data.paidAmount ?? 0),
  paidAt: data.paid_at ?? data.paidAt ?? null,
  paymentMethod: data.payment_method ?? data.paymentMethod ?? null,
  paymentReference: data.payment_reference ?? data.paymentReference ?? null,
  paymentTransactionId: data.payment_transaction_id ?? data.paymentTransactionId ?? null,
  paymentProvider: data.payment_provider ?? data.paymentProvider ?? null,
  cancelledAt: data.cancelled_at ?? data.cancelledAt ?? null,
  notes: data.notes ?? null,
  history: (data.history ?? []).map(mapHistoryItem),
});

export const mapAppointmentCreateToApi = (payload: Partial<Appointment>): AnyRecord =>
  clean({
    client_name: payload.clientName || undefined,
    client_email: payload.clientEmail || undefined,
    client_phone: payload.clientPhone || undefined,
    service_id: payload.serviceId,
    professional_id: payload.professionalId,
    date: payload.date,
    time: payload.time,
    notes: payload.notes ?? undefined,
  });

export const mapAppointmentPaymentInitFromApi = (data: AnyRecord): AppointmentPaymentInitResponse => ({
  appointmentId: data.appointment_id ?? data.appointmentId,
  paymentReference: data.payment_reference ?? data.paymentReference,
  provider: data.provider,
  amount: Number(data.amount ?? 0),
  currency: data.currency ?? 'COP',
  paymentDueAt: data.payment_due_at ?? data.paymentDueAt ?? null,
  status: data.status,
  checkoutUrl: data.checkout_url ?? data.checkoutUrl ?? null,
});

export const mapCompanyFromApi = (data: AnyRecord): CompanyData => ({
  businessName: data.business_name ?? data.businessName ?? null,
  legalName: data.legal_name ?? data.legalName ?? null,
  nit: data.nit ?? null,
  address: data.address ?? null,
  city: data.city ?? null,
  state: data.state ?? null,
  phone: data.phone ?? null,
  email: data.email ?? null,
  weekStart: data.week_start ?? data.weekStart ?? null,
  weekEnd: data.week_end ?? data.weekEnd ?? null,
  satStart: data.sat_start ?? data.satStart ?? null,
  satEnd: data.sat_end ?? data.satEnd ?? null,
  sunStart: data.sun_start ?? data.sunStart ?? null,
  sunEnd: data.sun_end ?? data.sunEnd ?? null,
  instagram: data.instagram ?? null,
  facebook: data.facebook ?? null,
  whatsapp: data.whatsapp ?? null,
  welcomeMsg: data.welcome_msg ?? data.welcomeMsg ?? null,
});

export const mapCompanyToApi = (payload: CompanyData): AnyRecord =>
  clean({
    business_name: payload.businessName,
    legal_name: payload.legalName,
    nit: payload.nit,
    address: payload.address,
    city: payload.city,
    state: payload.state,
    phone: payload.phone,
    email: payload.email,
    week_start: payload.weekStart,
    week_end: payload.weekEnd,
    sat_start: payload.satStart,
    sat_end: payload.satEnd,
    sun_start: payload.sunStart,
    sun_end: payload.sunEnd,
    instagram: payload.instagram,
    facebook: payload.facebook,
    whatsapp: payload.whatsapp,
    welcome_msg: payload.welcomeMsg,
  });

export const mapBrandingFromApi = (data: AnyRecord): Branding => {
  const landingImages = data.landing_images ?? data.landingImages;
  return {
    spLogo: resolveAssetUrl(data.sp_logo ?? data.spLogo ?? null),
    landingImages: landingImages
      ? {
          section1: resolveAssetUrl(landingImages.section1 ?? null),
          section2: resolveAssetUrl(landingImages.section2 ?? null),
          section3: resolveAssetUrl(landingImages.section3 ?? null),
        }
      : undefined,
  };
};

export const mapBrandingToApi = (payload: Branding): AnyRecord =>
  clean({
    sp_logo: payload.spLogo,
    landing_images: payload.landingImages
      ? clean({
          section1: payload.landingImages.section1 ?? undefined,
          section2: payload.landingImages.section2 ?? undefined,
          section3: payload.landingImages.section3 ?? undefined,
        })
      : undefined,
  });
