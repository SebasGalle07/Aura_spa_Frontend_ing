import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, tap, timeout } from 'rxjs';

import { environment } from '../../environments/environment';
import { Professional } from './models';
import { mapProfessionalFromApi, mapProfessionalToApi } from './api-mappers';

@Injectable({ providedIn: 'root' })
export class ProfessionalsService {
  private listCache$?: Observable<Professional[]>;

  constructor(private http: HttpClient) {}

  list(forceRefresh = false): Observable<Professional[]> {
    if (!forceRefresh && this.listCache$) {
      return this.listCache$;
    }

    this.listCache$ = this.http.get<Professional[]>(`${environment.apiUrl}/professionals`).pipe(
      timeout(12000),
      map((items) => items.map((item) => mapProfessionalFromApi(item as unknown as Record<string, unknown>))),
      catchError(() => of([])),
      shareReplay(1),
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
