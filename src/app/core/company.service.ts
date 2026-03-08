import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of, tap, timeout } from 'rxjs';

import { environment } from '../../environments/environment';
import { Branding, CompanyData } from './models';
import { mapBrandingFromApi, mapBrandingToApi, mapCompanyFromApi, mapCompanyToApi } from './api-mappers';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private companySubject = new BehaviorSubject<CompanyData | null>(null);
  private brandingSubject = new BehaviorSubject<Branding | null>(null);

  company$ = this.companySubject.asObservable();
  branding$ = this.brandingSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadPublic(): Observable<{ company: CompanyData; branding: Branding }> {
    return forkJoin({
      company: this.fetchCompany(),
      branding: this.fetchBranding(),
    });
  }

  fetchCompany(): Observable<CompanyData> {
    return this.http.get<CompanyData>(`${environment.apiUrl}/company`).pipe(
      timeout(12000),
      map((item) => mapCompanyFromApi(item as unknown as Record<string, unknown>)),
      catchError(() =>
        of({
          businessName: 'Aura Spa',
          address: 'Cra. 14 #21-35, Centro, Armenia, Quindio, Colombia',
          phone: '+57 300 593 9785',
          email: 'elizabeth.mayao@uqvirtual.edu.co',
        }),
      ),
      tap((c) => this.companySubject.next(c)),
    );
  }

  fetchBranding(): Observable<Branding> {
    return this.http.get<Branding>(`${environment.apiUrl}/branding`).pipe(
      timeout(12000),
      map((item) => mapBrandingFromApi(item as unknown as Record<string, unknown>)),
      catchError(() => of({})),
      tap((b) => this.brandingSubject.next(b)),
    );
  }

  fetchAdminCompany(): Observable<CompanyData> {
    return this.http.get<CompanyData>(`${environment.apiUrl}/admin/company`).pipe(
      timeout(15000),
      map((item) => mapCompanyFromApi(item as unknown as Record<string, unknown>)),
      tap((c) => this.companySubject.next(c)),
    );
  }

  updateAdminCompany(payload: CompanyData): Observable<CompanyData> {
    return this.http.put<CompanyData>(`${environment.apiUrl}/admin/company`, mapCompanyToApi(payload)).pipe(
      timeout(15000),
      map((item) => mapCompanyFromApi(item as unknown as Record<string, unknown>)),
      tap((c) => this.companySubject.next(c)),
    );
  }

  fetchAdminBranding(): Observable<Branding> {
    return this.http.get<Branding>(`${environment.apiUrl}/admin/branding`).pipe(
      timeout(15000),
      map((item) => mapBrandingFromApi(item as unknown as Record<string, unknown>)),
      tap((b) => this.brandingSubject.next(b)),
    );
  }

  updateAdminBranding(payload: Branding): Observable<Branding> {
    return this.http.put<Branding>(`${environment.apiUrl}/admin/branding`, mapBrandingToApi(payload)).pipe(
      timeout(15000),
      map((item) => mapBrandingFromApi(item as unknown as Record<string, unknown>)),
      tap((b) => this.brandingSubject.next(b)),
    );
  }

  uploadBrandingImage(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${environment.apiUrl}/admin/branding/upload`, form).pipe(
      timeout(30000),
    );
  }
}

