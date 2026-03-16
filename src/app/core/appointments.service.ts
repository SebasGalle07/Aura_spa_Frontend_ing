import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError, timeout } from 'rxjs';

import { environment } from '../../environments/environment';
import { Appointment, AppointmentPaymentInitResponse, PaymentSyncResponse } from './models';
import { mapAppointmentCreateToApi, mapAppointmentFromApi, mapAppointmentPaymentInitFromApi } from './api-mappers';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(private http: HttpClient) {}

  listAll(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${environment.apiUrl}/appointments`).pipe(
      timeout(15000),
      map((items) => items.map((item) => mapAppointmentFromApi(item as unknown as Record<string, unknown>))),
      catchError((err) => throwError(() => err)),
    );
  }

  listMine(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${environment.apiUrl}/appointments/my`).pipe(
      timeout(15000),
      map((items) => items.map((item) => mapAppointmentFromApi(item as unknown as Record<string, unknown>))),
      catchError((err) => throwError(() => err)),
    );
  }

  create(payload: Partial<Appointment>): Observable<Appointment> {
    return this.http
      .post<Appointment>(`${environment.apiUrl}/appointments`, mapAppointmentCreateToApi(payload))
      .pipe(timeout(20000), map((item) => mapAppointmentFromApi(item as unknown as Record<string, unknown>)));
  }

  cancel(id: number, notes?: string): Observable<Appointment> {
    return this.http
      .post<Appointment>(`${environment.apiUrl}/appointments/${id}/cancel`, { notes })
      .pipe(timeout(15000), map((item) => mapAppointmentFromApi(item as unknown as Record<string, unknown>)));
  }

  attend(id: number, notes?: string): Observable<Appointment> {
    return this.http
      .post<Appointment>(`${environment.apiUrl}/appointments/${id}/attend`, { notes })
      .pipe(timeout(15000), map((item) => mapAppointmentFromApi(item as unknown as Record<string, unknown>)));
  }

  confirm(id: number, notes?: string): Observable<Appointment> {
    return this.http
      .post<Appointment>(`${environment.apiUrl}/appointments/${id}/confirm`, { notes })
      .pipe(timeout(15000), map((item) => mapAppointmentFromApi(item as unknown as Record<string, unknown>)));
  }

  reschedule(id: number, date: string, time: string): Observable<Appointment> {
    return this.http
      .post<Appointment>(`${environment.apiUrl}/appointments/${id}/reschedule`, { date, time })
      .pipe(timeout(15000), map((item) => mapAppointmentFromApi(item as unknown as Record<string, unknown>)));
  }

  initPayment(id: number, method?: string): Observable<AppointmentPaymentInitResponse> {
    return this.http
      .post<AppointmentPaymentInitResponse>(`${environment.apiUrl}/appointments/${id}/payments/init`, {
        method: method || undefined,
      })
      .pipe(timeout(15000), map((item) => mapAppointmentPaymentInitFromApi(item as unknown as Record<string, unknown>)));
  }

  getPaymentCheckoutData(reference: string): Observable<AppointmentPaymentInitResponse> {
    return this.http
      .get<AppointmentPaymentInitResponse>(`${environment.apiUrl}/appointments/payments/by-reference/${reference}`)
      .pipe(timeout(15000), map((item) => mapAppointmentPaymentInitFromApi(item as unknown as Record<string, unknown>)));
  }

  completeMockPayment(reference: string, status: 'approved' | 'rejected' | 'expired' | 'cancelled', method = 'mock_card'): Observable<Appointment> {
    return this.http
      .post<Appointment>(`${environment.apiUrl}/appointments/payments/mock-checkout/complete`, {
        provider_reference: reference,
        status,
        method,
      })
      .pipe(timeout(15000), map((item) => mapAppointmentFromApi(item as unknown as Record<string, unknown>)));
  }

  syncWompiTransaction(transactionId: string, reference: string): Observable<PaymentSyncResponse> {
    return this.http.get<PaymentSyncResponse>(
      `${environment.apiUrl}/appointments/payments/wompi/transactions/${transactionId}?reference=${encodeURIComponent(reference)}`,
    ).pipe(timeout(15000));
  }

  mockApprovePayment(id: number, method = 'mock_card'): Observable<Appointment> {
    return this.http
      .post<Appointment>(`${environment.apiUrl}/appointments/${id}/payments/mock-approve`, { method })
      .pipe(timeout(15000), map((item) => mapAppointmentFromApi(item as unknown as Record<string, unknown>)));
  }

  availability(serviceId: number, professionalId: number, date: string): Observable<string[]> {
    const url = `${environment.apiUrl}/availability?service_id=${serviceId}&professional_id=${professionalId}&date=${date}`;
    return this.http.get<string[]>(url).pipe(
      timeout(15000),
      catchError((err) => throwError(() => err)),
    );
  }
}
