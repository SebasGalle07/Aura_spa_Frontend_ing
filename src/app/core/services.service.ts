import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, shareReplay, tap, throwError, timeout } from 'rxjs';

import { environment } from '../../environments/environment';
import { Service } from './models';
import { mapServiceFromApi, mapServiceToApi } from './api-mappers';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private listCache$?: Observable<Service[]>;

  constructor(private http: HttpClient) {}

  list(forceRefresh = false): Observable<Service[]> {
    if (!forceRefresh && this.listCache$) {
      return this.listCache$;
    }

    const request$ = this.http.get<Service[]>(`${environment.apiUrl}/services`).pipe(
      timeout(30000),
      map((items) => items.map((item) => mapServiceFromApi(item as unknown as Record<string, unknown>))),
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

  create(payload: Partial<Service>): Observable<Service> {
    return this.http
      .post<Service>(`${environment.apiUrl}/services`, mapServiceToApi(payload))
      .pipe(
        map((item) => mapServiceFromApi(item as unknown as Record<string, unknown>)),
        tap(() => (this.listCache$ = undefined)),
      );
  }

  update(id: number, payload: Partial<Service>): Observable<Service> {
    return this.http
      .put<Service>(`${environment.apiUrl}/services/${id}`, mapServiceToApi(payload))
      .pipe(
        map((item) => mapServiceFromApi(item as unknown as Record<string, unknown>)),
        tap(() => (this.listCache$ = undefined)),
      );
  }

  remove(id: number): Observable<{ ok: boolean }> {
    return this.http
      .delete<{ ok: boolean }>(`${environment.apiUrl}/services/${id}?soft=true`)
      .pipe(tap(() => (this.listCache$ = undefined)));
  }

  uploadImage(id: number, file: File): Observable<Service> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Service>(`${environment.apiUrl}/services/${id}/image`, form).pipe(
      timeout(30000),
      map((item) => mapServiceFromApi(item as unknown as Record<string, unknown>)),
      tap(() => (this.listCache$ = undefined)),
    );
  }

  removeImage(id: number): Observable<Service> {
    return this.http.delete<Service>(`${environment.apiUrl}/services/${id}/image`).pipe(
      timeout(15000),
      map((item) => mapServiceFromApi(item as unknown as Record<string, unknown>)),
      tap(() => (this.listCache$ = undefined)),
    );
  }
}
