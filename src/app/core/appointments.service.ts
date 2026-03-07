import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError, timeout } from 'rxjs';

import { environment } from '../../environments/environment';
import { Appointment } from './models';
import { mapAppointmentCreateToApi, mapAppointmentFromApi } from './api-mappers';

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

  availability(serviceId: number, professionalId: number, date: string): Observable<string[]> {
    const url = `${environment.apiUrl}/availability?service_id=${serviceId}&professional_id=${professionalId}&date=${date}`;
    return this.http.get<string[]>(url).pipe(
      timeout(15000),
      catchError((err) => throwError(() => err)),
    );
  }
}
