import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { TokenResponse, User } from './models';
import { mapUserFromApi } from './api-mappers';

type ApiTokenResponse = {
  accessToken?: string;
  access_token?: string;
  tokenType?: string;
  token_type?: string;
  user: User;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'aura_token';
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<ApiTokenResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        map((res) => this.normalizeToken(res)),
        tap(({ accessToken, user }) => this.setSession(accessToken, user)),
        map(({ user }) => user),
      );
  }

  register(payload: { name: string; email: string; phone?: string; password: string }): Observable<User> {
    return this.http
      .post<ApiTokenResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(
        map((res) => this.normalizeToken(res)),
        tap(({ accessToken, user }) => this.setSession(accessToken, user)),
        map(({ user }) => user),
      );
  }

  restoreSession(): Observable<User | null> {
    if (!this.token) {
      this.userSubject.next(null);
      return new BehaviorSubject<User | null>(null).asObservable();
    }
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      map((user) => mapUserFromApi(user as unknown as Record<string, unknown>)),
      tap((user) => this.userSubject.next(user)),
      map((user) => user ?? null),
    );
  }

  logout(redirectToLogin = true): void {
    localStorage.removeItem(this.tokenKey);
    this.userSubject.next(null);
    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }

  private normalizeToken(res: ApiTokenResponse): TokenResponse {
    const token = res.accessToken || res.access_token || '';
    return {
      accessToken: token,
      tokenType: res.tokenType || res.token_type || 'bearer',
      user: mapUserFromApi(res.user as unknown as Record<string, unknown>),
    };
  }

  private setSession(token: string, user: User): void {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    }
    this.userSubject.next(user);
  }
}


