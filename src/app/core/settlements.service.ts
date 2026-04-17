import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, timeout } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  ServiceSettlement,
  SettlementPayment,
  SettlementPaymentCreate,
  SettlementReceipt,
} from './models';

type ApiObject = Record<string, any>;

const read = (item: ApiObject, snakeKey: string, camelKey: string, fallback: unknown = null): any =>
  item[snakeKey] ?? item[camelKey] ?? fallback;

function mapPaymentFromApi(item: ApiObject): SettlementPayment {
  return {
    id: item['id'],
    settlementId: read(item, 'settlement_id', 'settlementId'),
    amount: item['amount'],
    method: item['method'],
    reference: item['reference'] ?? null,
    notes: item['notes'] ?? null,
    createdByUserId: read(item, 'created_by_user_id', 'createdByUserId'),
    createdAt: read(item, 'created_at', 'createdAt'),
  };
}

function mapReceiptFromApi(item: ApiObject): SettlementReceipt {
  return {
    id: item['id'],
    settlementId: read(item, 'settlement_id', 'settlementId'),
    receiptNumber: read(item, 'receipt_number', 'receiptNumber'),
    totalAmount: read(item, 'total_amount', 'totalAmount', 0),
    issuedAt: read(item, 'issued_at', 'issuedAt'),
    receiptPayload: read(item, 'receipt_payload', 'receiptPayload', {}) || {},
  };
}

function mapSettlementFromApi(item: ApiObject): ServiceSettlement {
  return {
    id: item['id'],
    appointmentId: read(item, 'appointment_id', 'appointmentId'),
    clientUserId: read(item, 'client_user_id', 'clientUserId'),
    serviceId: read(item, 'service_id', 'serviceId'),
    totalAmount: read(item, 'total_amount', 'totalAmount', 0),
    depositAmount: read(item, 'deposit_amount', 'depositAmount', 0),
    balanceAmount: read(item, 'balance_amount', 'balanceAmount', 0),
    paidAmount: read(item, 'paid_amount', 'paidAmount', 0),
    status: item['status'],
    settledAt: read(item, 'settled_at', 'settledAt'),
    notes: item['notes'] ?? null,
    createdAt: read(item, 'created_at', 'createdAt'),
    updatedAt: read(item, 'updated_at', 'updatedAt'),
    payments: (item['payments'] || []).map((payment: ApiObject) => mapPaymentFromApi(payment)),
    receipts: (item['receipts'] || []).map((receipt: ApiObject) => mapReceiptFromApi(receipt)),
  };
}

@Injectable({ providedIn: 'root' })
export class SettlementsService {
  constructor(private http: HttpClient) {}

  listAll(filters: { status?: string; appointmentId?: number; serviceId?: number; clientUserId?: number } = {}): Observable<ServiceSettlement[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.appointmentId) params = params.set('appointment_id', filters.appointmentId);
    if (filters.serviceId) params = params.set('service_id', filters.serviceId);
    if (filters.clientUserId) params = params.set('client_user_id', filters.clientUserId);

    return this.http.get<ApiObject[]>(`${environment.apiUrl}/settlements`, { params }).pipe(
      timeout(15000),
      map((items) => items.map((item) => mapSettlementFromApi(item))),
    );
  }

  listMine(): Observable<ServiceSettlement[]> {
    return this.http.get<ApiObject[]>(`${environment.apiUrl}/settlements/my`).pipe(
      timeout(15000),
      map((items) => items.map((item) => mapSettlementFromApi(item))),
    );
  }

  getOne(id: number): Observable<ServiceSettlement> {
    return this.http.get<ApiObject>(`${environment.apiUrl}/settlements/${id}`).pipe(
      timeout(15000),
      map((item) => mapSettlementFromApi(item)),
    );
  }

  registerPayment(id: number, payload: SettlementPaymentCreate): Observable<ServiceSettlement> {
    return this.http.post<ApiObject>(`${environment.apiUrl}/settlements/${id}/payments`, payload).pipe(
      timeout(15000),
      map((item) => mapSettlementFromApi(item)),
    );
  }

  issueReceipt(id: number): Observable<SettlementReceipt> {
    return this.http.post<ApiObject>(`${environment.apiUrl}/settlements/${id}/issue-receipt`, {}).pipe(
      timeout(15000),
      map((item) => mapReceiptFromApi(item)),
    );
  }

  getReceipt(id: number): Observable<SettlementReceipt> {
    return this.http.get<ApiObject>(`${environment.apiUrl}/settlements/${id}/receipt`).pipe(
      timeout(15000),
      map((item) => mapReceiptFromApi(item)),
    );
  }
}
