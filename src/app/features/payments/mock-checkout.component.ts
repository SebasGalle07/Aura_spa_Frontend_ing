import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DatePipe, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AppointmentsService } from '../../core/appointments.service';
import { Appointment, AppointmentPaymentInitResponse } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-mock-checkout',
  standalone: true,
  imports: [NgIf, RouterLink, DatePipe],
  templateUrl: './mock-checkout.component.html',
  styleUrl: './mock-checkout.component.scss',
})
export class MockCheckoutComponent implements OnInit {
  @ViewChild('wompiForm') wompiForm?: ElementRef<HTMLFormElement>;
  loading = true;
  processing = false;
  error = '';
  reference = '';
  returnTo = '/appointments';
  stage = 'checkout';
  transactionId = '';
  paymentIntent?: AppointmentPaymentInitResponse;
  latestAppointment?: Appointment;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentsApi: AppointmentsService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.reference = (params.get('reference') || '').trim();
      this.stage = (params.get('stage') || 'checkout').trim().toLowerCase();
      this.transactionId = (params.get('id') || '').trim();
      const requestedReturnTo = (params.get('returnTo') || '').trim();
      this.returnTo = requestedReturnTo.startsWith('/') ? requestedReturnTo : '/appointments';
      this.loadCheckout();
    });
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  isExpired(): boolean {
    if (!this.paymentIntent?.paymentDueAt) {
      return false;
    }
    return new Date(this.paymentIntent.paymentDueAt).getTime() <= Date.now();
  }

  canSimulatePayment(): boolean {
    return !!this.paymentIntent && this.paymentIntent.status === 'pending' && !this.isExpired() && !this.processing;
  }

  isWompi(): boolean {
    return this.paymentIntent?.provider?.toLowerCase() === 'wompi';
  }

  canContinueToGateway(): boolean {
    return !!this.paymentIntent && this.paymentIntent.status === 'pending' && !this.isExpired() && !this.processing;
  }

  continueToGateway(): void {
    if (!this.canContinueToGateway()) {
      return;
    }
    if (this.isWompi()) {
      this.wompiForm?.nativeElement.submit();
      return;
    }
  }

  process(status: 'approved' | 'rejected' | 'expired'): void {
    if (!this.reference || this.processing) {
      return;
    }
    this.processing = true;
    this.error = '';
    this.appointmentsApi.completeMockPayment(this.reference, status).subscribe({
      next: (appointment) => {
        this.processing = false;
        this.latestAppointment = appointment;
        const messages: Record<string, string> = {
          approved: 'Pago simulado aprobado. La reserva quedo confirmada.',
          rejected: 'Pago simulado rechazado. La reserva sigue pendiente mientras no expire.',
          expired: 'Pago simulado expirado. La reserva fue liberada.',
        };
        this.toast.show(messages[status], status === 'approved' ? 'success' : 'error');
        this.router.navigate([this.returnTo]);
      },
      error: (err) => {
        this.processing = false;
        this.error = err?.error?.detail || 'No fue posible procesar el pago simulado.';
      },
    });
  }

  private loadCheckout(): void {
    if (!this.reference) {
      this.loading = false;
      this.error = 'No se encontro una referencia de pago valida.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.paymentIntent = undefined;
    this.latestAppointment = undefined;
    this.appointmentsApi.getPaymentCheckoutData(this.reference).subscribe({
      next: (paymentIntent) => {
        this.paymentIntent = paymentIntent;
        this.loading = false;
        if (this.stage === 'result' && this.isWompi()) {
          this.syncWompiResult();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail || 'No fue posible cargar el checkout simulado.';
      },
    });
  }

  private syncWompiResult(): void {
    if (!this.transactionId) {
      this.error = 'No fue posible identificar la transaccion devuelta por Wompi.';
      return;
    }
    this.processing = true;
    this.appointmentsApi.syncWompiTransaction(this.transactionId, this.reference).subscribe({
      next: (result) => {
        this.processing = false;
        const status = (result.providerTransactionStatus || '').toUpperCase();
        if (status === 'APPROVED') {
          this.toast.show('Pago aprobado por Wompi. La reserva quedo confirmada.', 'success');
        } else if (status) {
          this.toast.show(`Wompi reporto la transaccion como ${status}.`, 'info');
        }
        this.router.navigate([this.returnTo]);
      },
      error: (err) => {
        this.processing = false;
        this.error = err?.error?.detail || 'No fue posible validar el resultado del pago con Wompi.';
      },
    });
  }
}
