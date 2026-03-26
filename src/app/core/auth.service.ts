import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { TokenResponse, User } from './models';
import { mapUserFromApi } from './api-mappers';

type ApiTokenResponse = {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string | null;
  refresh_token?: string | null;
  tokenType?: string;
  token_type?: string;
  user: User;
};

type ApiRegisterResponse = {
  ok: boolean;
  email_verification_required?: boolean;
  emailVerificationRequired?: boolean;
};

type ForgotPasswordResponse = {
  ok: boolean;
  reset_token?: string | null;
  resetToken?: string | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'aura_token';
  private readonly refreshTokenKey = 'aura_refresh_token';
  private readonly transientSessionKeys = ['aura_spa_booking_draft_v1', 'aura_spa_register_draft_v1'];
  private userSubject = new BehaviorSubject<User | null>(null);
  private refreshInFlight$?: Observable<string>;
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<ApiTokenResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        map((res) => this.normalizeToken(res)),
        tap(({ accessToken, refreshToken, user }) => this.setSession(accessToken, user, refreshToken)),
        map(({ user }) => user),
      );
  }

  loginWithGoogle(idToken: string): Observable<User> {
    return this.http
      .post<ApiTokenResponse>(`${environment.apiUrl}/auth/google`, { id_token: idToken })
      .pipe(
        map((res) => this.normalizeToken(res)),
        tap(({ accessToken, refreshToken, user }) => this.setSession(accessToken, user, refreshToken)),
        map(({ user }) => user),
      );
  }

  register(payload: { name: string; email: string; phone?: string; password: string }): Observable<{ ok: boolean; emailVerificationRequired: boolean }> {
    return this.http
      .post<ApiRegisterResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(
        map((res) => ({
          ok: res.ok,
          emailVerificationRequired: res.email_verification_required ?? res.emailVerificationRequired ?? true,
        })),
      );
  }

  resendVerification(email: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${environment.apiUrl}/auth/resend-verification`, { email });
  }

  verifyEmail(token: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${environment.apiUrl}/auth/verify-email`, { token });
  }

  refreshAccessToken(): Observable<string> {
    if (!this.refreshToken) {
      return throwError(() => new Error('Refresh token unavailable'));
    }
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http
        .post<ApiTokenResponse>(`${environment.apiUrl}/auth/refresh`, { refresh_token: this.refreshToken })
        .pipe(
          map((res) => this.normalizeToken(res)),
          tap(({ accessToken, refreshToken, user }) => this.setSession(accessToken, user, refreshToken)),
          map(({ accessToken }) => accessToken),
          finalize(() => {
            this.refreshInFlight$ = undefined;
          }),
          shareReplay(1),
        );
    }
    return this.refreshInFlight$;
  }

  restoreSession(): Observable<User | null> {
    if (!this.token) {
      this.userSubject.next(null);
      return of(null);
    }
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      map((user) => mapUserFromApi(user as unknown as Record<string, unknown>)),
      tap((user) => this.userSubject.next(user)),
      map((user) => user ?? null),
      catchError(() => {
        if (!this.refreshToken) {
          this.clearSession();
          return of(null);
        }
        return this.refreshAccessToken().pipe(
          switchMap(() => this.http.get<User>(`${environment.apiUrl}/auth/me`)),
          map((user) => mapUserFromApi(user as unknown as Record<string, unknown>)),
          tap((user) => this.userSubject.next(user)),
          map((user) => user ?? null),
          catchError(() => {
            this.clearSession();
            return of(null);
          }),
        );
      }),
    );
  }

  forgotPassword(email: string): Observable<{ ok: boolean; resetToken?: string | null }> {
    return this.http
      .post<ForgotPasswordResponse>(`${environment.apiUrl}/auth/forgot-password`, { email })
      .pipe(
        map((res) => ({
          ok: res.ok,
          resetToken: res.reset_token ?? res.resetToken ?? null,
        })),
      );
  }

  resetPassword(token: string, newPassword: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${environment.apiUrl}/auth/reset-password`, {
      token,
      new_password: newPassword,
    });
  }

  logout(redirectToLogin = true): void {
    const refreshToken = this.refreshToken;
    this.clearSession();
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refresh_token: refreshToken }).subscribe({
        error: () => {},
      });
    }
    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }

  syncCurrentUser(user: User): void {
    this.userSubject.next(user);
  }

  private normalizeToken(res: ApiTokenResponse): TokenResponse {
    const token = res.accessToken || res.access_token || '';
    const refreshToken = res.refreshToken ?? res.refresh_token ?? null;
    return {
      accessToken: token,
      refreshToken,
      tokenType: res.tokenType || res.token_type || 'bearer',
      user: mapUserFromApi(res.user as unknown as Record<string, unknown>),
    };
  }

  private setSession(token: string, user: User, refreshToken?: string | null): void {
    this.clearTransientSessionState();
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    }
    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    }
    this.userSubject.next(user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.clearTransientSessionState();
    this.userSubject.next(null);
  }

  private clearTransientSessionState(): void {
    for (const key of this.transientSessionKeys) {
      sessionStorage.removeItem(key);
    }
  }
}
