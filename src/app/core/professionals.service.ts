import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, shareReplay, tap, throwError, timeout } from 'rxjs';

import { environment } from '../../environments/environment';
import { Professional } from './models';
import { mapProfessionalFromApi, mapProfessionalToApi } from './api-mappers';

@Injectable({ providedIn: 'root' })
export class ProfessionalsService {
  private listCache$?: Observable<Professional[]>;

  constructor(private http: HttpClient) {}

  list(forceRefresh = false, serviceId?: number): Observable<Professional[]> {
    if (serviceId) {
      return this.http.get<Professional[]>(`${environment.apiUrl}/professionals`, { params: { service_id: serviceId } }).pipe(
        timeout(30000),
        map((items) => items.map((item) => mapProfessionalFromApi(item as unknown as Record<string, unknown>))),
      );
    }

    if (!forceRefresh && this.listCache$) {
      return this.listCache$;
    }

    const request$ = this.http.get<Professional[]>(`${environment.apiUrl}/professionals`).pipe(
      timeout(30000),
      map((items) => items.map((item) => mapProfessionalFromApi(item as unknown as Record<string, unknown>))),
      shareReplay(1),
    );

    this.listCache$ = request$.pipe(
      catchError((err) => {
        this.listCache$ = undefined;
        return throwError(() => err);
      }),
    );

    return this.listCache$;
  }

  create(payload: Partial<Professional>): Observable<Professional> {
    return this.http
      .post<Professional>(`${environment.apiUrl}/professionals`, mapProfessionalToApi(payload))
      .pipe(
        map((item) => mapProfessionalFromApi(item as unknown as Record<string, unknown>)),
        tap(() => (this.listCache$ = undefined)),
      );
  }

  update(id: number, payload: Partial<Professional>): Observable<Professional> {
    return this.http
      .put<Professional>(`${environment.apiUrl}/professionals/${id}`, mapProfessionalToApi(payload))
      .pipe(
        map((item) => mapProfessionalFromApi(item as unknown as Record<string, unknown>)),
        tap(() => (this.listCache$ = undefined)),
      );
  }
}
