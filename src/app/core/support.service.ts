import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { AccountCancellationRequest, AuditLog } from './models';

type AnyRecord = Record<string, any>;

const mapCancellation = (data: AnyRecord): AccountCancellationRequest => ({
  id: data['id'],
  userId: data['user_id'] ?? data['userId'],
  status: data['status'],
  reason: data['reason'],
  adminResponse: data['admin_response'] ?? data['adminResponse'] ?? null,
  reviewedByUserId: data['reviewed_by_user_id'] ?? data['reviewedByUserId'] ?? null,
  reviewedAt: data['reviewed_at'] ?? data['reviewedAt'] ?? null,
  createdAt: data['created_at'] ?? data['createdAt'],
  updatedAt: data['updated_at'] ?? data['updatedAt'],
});

const mapAuditLog = (data: AnyRecord): AuditLog => ({
  id: data['id'],
  actorUserId: data['actor_user_id'] ?? data['actorUserId'] ?? null,
  actorRole: data['actor_role'] ?? data['actorRole'] ?? null,
  action: data['action'],
  entityType: data['entity_type'] ?? data['entityType'],
  entityId: data['entity_id'] ?? data['entityId'] ?? null,
  oldValue: data['old_value'] ?? data['oldValue'] ?? null,
  newValue: data['new_value'] ?? data['newValue'] ?? null,
  ipAddress: data['ip_address'] ?? data['ipAddress'] ?? null,
  userAgent: data['user_agent'] ?? data['userAgent'] ?? null,
  createdAt: data['created_at'] ?? data['createdAt'],
});

@Injectable({ providedIn: 'root' })
export class SupportService {
  constructor(private http: HttpClient) {}

  requestAccountCancellation(reason: string): Observable<AccountCancellationRequest> {
    return this.http
      .post<AnyRecord>(`${environment.apiUrl}/account-cancellation-requests/me`, { reason })
      .pipe(map(mapCancellation));
  }

  listAccountCancellationRequests(): Observable<AccountCancellationRequest[]> {
    return this.http
      .get<AnyRecord[]>(`${environment.apiUrl}/account-cancellation-requests`)
      .pipe(map((items) => items.map(mapCancellation)));
  }

  listAuditLogs(limit = 100, offset = 0): Observable<AuditLog[]> {
    return this.http
      .get<AnyRecord[]>(`${environment.apiUrl}/audit-logs?limit=${limit}&offset=${offset}`)
      .pipe(map((items) => items.map(mapAuditLog)));
  }
}
