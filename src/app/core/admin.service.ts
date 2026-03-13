import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface AdminSummary {
  date: string;
  today_total: number;
  pending_payment: number;
  confirmed: number;
  completed: number;
  expired: number;
  cancelled: number;
  rescheduled: number;
  agenda: any[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getSummary(date?: string): Observable<AdminSummary> {
    const suffix = date ? `?date=${date}` : '';
    return this.http.get<AdminSummary>(`${environment.apiUrl}/admin/summary${suffix}`);
  }
}


