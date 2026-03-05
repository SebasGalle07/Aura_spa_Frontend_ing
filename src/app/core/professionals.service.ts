import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { Professional } from './models';
import { mapProfessionalFromApi, mapProfessionalToApi } from './api-mappers';

@Injectable({ providedIn: 'root' })
export class ProfessionalsService {
  constructor(private http: HttpClient) {}

  list(): Observable<Professional[]> {
    return this.http
      .get<Professional[]>(`${environment.apiUrl}/professionals`)
      .pipe(map((items) => items.map((item) => mapProfessionalFromApi(item as unknown as Record<string, unknown>))));
  }

  create(payload: Partial<Professional>): Observable<Professional> {
    return this.http
      .post<Professional>(`${environment.apiUrl}/professionals`, mapProfessionalToApi(payload))
      .pipe(map((item) => mapProfessionalFromApi(item as unknown as Record<string, unknown>)));
  }

  update(id: number, payload: Partial<Professional>): Observable<Professional> {
    return this.http
      .put<Professional>(`${environment.apiUrl}/professionals/${id}`, mapProfessionalToApi(payload))
      .pipe(map((item) => mapProfessionalFromApi(item as unknown as Record<string, unknown>)));
  }
}


