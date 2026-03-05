import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { User } from './models';
import { mapUserFromApi, mapUserToApi } from './api-mappers';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  list(): Observable<User[]> {
    return this.http
      .get<User[]>(`${environment.apiUrl}/users`)
      .pipe(map((items) => items.map((item) => mapUserFromApi(item as unknown as Record<string, unknown>))));
  }

  create(payload: Partial<User> & { password: string }): Observable<User> {
    return this.http
      .post<User>(`${environment.apiUrl}/users`, mapUserToApi(payload))
      .pipe(map((item) => mapUserFromApi(item as unknown as Record<string, unknown>)));
  }

  update(id: number, payload: Partial<User> & { password?: string }): Observable<User> {
    return this.http
      .put<User>(`${environment.apiUrl}/users/${id}`, mapUserToApi(payload))
      .pipe(map((item) => mapUserFromApi(item as unknown as Record<string, unknown>)));
  }

  remove(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${environment.apiUrl}/users/${id}`);
  }

  updateMe(payload: Partial<User>): Observable<User> {
    return this.http
      .put<User>(`${environment.apiUrl}/users/me`, mapUserToApi(payload))
      .pipe(map((item) => mapUserFromApi(item as unknown as Record<string, unknown>)));
  }

  changePassword(payload: { currentPassword: string; newPassword: string }): Observable<User> {
    return this.http
      .post<User>(`${environment.apiUrl}/users/me/password`, {
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
      })
      .pipe(map((item) => mapUserFromApi(item as unknown as Record<string, unknown>)));
  }
}


