import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { Service } from './models';
import { mapServiceFromApi, mapServiceToApi } from './api-mappers';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  constructor(private http: HttpClient) {}

  list(): Observable<Service[]> {
    return this.http
      .get<Service[]>(`${environment.apiUrl}/services`)
      .pipe(map((items) => items.map((item) => mapServiceFromApi(item as unknown as Record<string, unknown>))));
  }

  create(payload: Partial<Service>): Observable<Service> {
    return this.http
      .post<Service>(`${environment.apiUrl}/services`, mapServiceToApi(payload))
      .pipe(map((item) => mapServiceFromApi(item as unknown as Record<string, unknown>)));
  }

  update(id: number, payload: Partial<Service>): Observable<Service> {
    return this.http
      .put<Service>(`${environment.apiUrl}/services/${id}`, mapServiceToApi(payload))
      .pipe(map((item) => mapServiceFromApi(item as unknown as Record<string, unknown>)));
  }

  remove(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${environment.apiUrl}/services/${id}?soft=true`);
  }
}


