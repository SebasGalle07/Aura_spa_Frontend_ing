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
  @ViewChild('payuForm') payuForm?: ElementRef<HTMLFormElement>;
  loading = true;
  processing = false;
  error = '';
  reference = '';
  returnTo = '/appointments';
  stage = 'checkout';
  transactionId = '';
  provider = '';
  payuTransactionState = '';
  paymentIntent?: AppointmentPaymentInitResponse;
  latestAppointment?: Appointment;
  private payuRefreshAttempts = 0;

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
      this.provider = (params.get('provider') || '').trim().toLowerCase();
      this.payuTransactionState = (params.get('transactionState') || '').trim();
      this.payuRefreshAttempts = 0;
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

  isPayU(): boolean {
    return this.paymentIntent?.provider?.toLowerCase() === 'payu' || this.provider === 'payu';
  }

  canContinueToGateway(): boolean {
    return !!this.paymentIntent && this.paymentIntent.status === 'pending' && !this.isExpired() && !this.processing;
  }

  continueToGateway(): void {
    if (!this.canContinueToGateway()) {
      return;
    }
    if (this.isPayU()) {
      this.payuForm?.nativeElement.submit();
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
        if (this.stage === 'result' && this.isPayU()) {
          this.resolvePayuReturn();
          this.refreshPayuStatus();
        }
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

  private resolvePayuReturn(): void {
    const state = this.payuTransactionState;
    if (state === '4') {
      this.toast.show('PayU reporto el pago como aprobado. Estamos actualizando tu reserva.', 'success');
    } else if (state === '6') {
      this.toast.show('PayU reporto el pago como rechazado.', 'error');
    } else if (state === '5') {
      this.toast.show('PayU reporto el pago como expirado.', 'error');
    } else if (state) {
      this.toast.show(`PayU devolvio el estado ${state}.`, 'info');
    }
  }

  private refreshPayuStatus(): void {
    if (!this.isPayU() || !this.reference || !this.paymentIntent || this.paymentIntent.status !== 'pending') {
      return;
    }
    if (this.payuRefreshAttempts >= 5) {
      return;
    }
    this.payuRefreshAttempts += 1;
    window.setTimeout(() => {
      this.appointmentsApi.getPaymentCheckoutData(this.reference).subscribe({
        next: (paymentIntent) => {
          this.paymentIntent = paymentIntent;
          if (paymentIntent.status === 'approved') {
            this.toast.show('PayU confirmo el pago del anticipo y la reserva quedo actualizada.', 'success');
            return;
          }
          if (paymentIntent.status === 'rejected' || paymentIntent.status === 'expired' || paymentIntent.status === 'cancelled') {
            return;
          }
          this.refreshPayuStatus();
        },
      });
    }, 2000);
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
