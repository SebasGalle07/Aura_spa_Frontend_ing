import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from './auth.service';

const isAuthRequest = (url: string): boolean =>
  url.includes('/auth/login') ||
  url.includes('/auth/register') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/forgot-password') ||
  url.includes('/auth/reset-password');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const shouldAttachToken = !!token && !isAuthRequest(req.url);
  const authReq = shouldAttachToken ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (err?.status !== 401) {
        return throwError(() => err);
      }
      if (isAuthRequest(req.url)) {
        return throwError(() => err);
      }
      if (!auth.refreshToken) {
        auth.logout(true);
        return throwError(() => err);
      }

      return auth.refreshAccessToken().pipe(
        switchMap((newToken) => {
          const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
          return next(retryReq);
        }),
        catchError((refreshErr) => {
          auth.logout(true);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
