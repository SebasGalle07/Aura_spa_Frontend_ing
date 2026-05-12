import { Component, OnInit } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AppointmentsService } from '../../core/appointments.service';
import { ServicesService } from '../../core/services.service';
import { ProfessionalsService } from '../../core/professionals.service';
import { SupportService } from '../../core/support.service';
import { ToastService } from '../../core/toast.service';
import { SettlementsService } from '../../core/settlements.service';
import { Appointment, Professional, Service, ServiceCase, ServiceSettlement, SettlementReceipt } from '../../core/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, DatePipe, FormsModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
  appointments: Appointment[] = [];
  services: Service[] = [];
  professionals: Professional[] = [];
  loading = true;
  settlements: ServiceSettlement[] = [];
  receipts: Record<number, SettlementReceipt> = {};
  serviceCases: ServiceCase[] = [];
  pqrsForms: Record<number, { caseType: ServiceCase['caseType']; subject: string; description: string; open: boolean }> = {};

  constructor(
    private appointmentsApi: AppointmentsService,
    private servicesApi: ServicesService,
    private professionalsApi: ProfessionalsService,
    private settlementsApi: SettlementsService,
    private supportApi: SupportService,
    private toast: ToastService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.appointmentsApi.listMine().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.loading = false;
      },
      error: () => {
        this.appointments = [];
        this.loading = false;
      },
    });

    this.servicesApi.list().subscribe({
      next: (services) => {
        this.services = services;
      },
      error: () => {
        this.services = [];
      },
    });

    this.professionalsApi.list().subscribe({
      next: (professionals) => {
        this.professionals = professionals;
      },
      error: () => {
        this.professionals = [];
      },
    });

    this.settlementsApi.listMine().subscribe({
      next: (settlements) => {
        this.settlements = settlements;
      },
      error: () => {
        this.settlements = [];
      },
    });

    this.supportApi.listMyServiceCases().subscribe({
      next: (items) => {
        this.serviceCases = items;
      },
      error: () => {
        this.serviceCases = [];
      },
    });
  }

  getServiceName(serviceId: number): string {
    return this.services.find((s) => s.id === serviceId)?.name || 'Servicio';
  }

  getProfessionalName(proId: number): string {
    return this.professionals.find((p) => p.id === proId)?.name || 'Profesional';
  }

  statusLabel(status: Appointment['status']): string {
    const labels: Record<string, string> = {
      pending_payment: 'Pendiente de pago',
      confirmed: 'Confirmada',
      expired: 'Expirada',
      cancelled: 'Cancelada',
      completed: 'Completada',
      no_show: 'No asistio',
      rescheduled: 'Reprogramada',
    };
    return labels[status] || status;
  }

  statusClass(status: Appointment['status']): string {
    const classes: Record<string, string> = {
      pending_payment: 'tag tag--pending',
      confirmed: 'tag tag--confirmed',
      expired: 'tag tag--expired',
      cancelled: 'tag tag--cancelled',
      completed: 'tag tag--completed',
      no_show: 'tag tag--no-show',
      rescheduled: 'tag tag--rescheduled',
    };
    return classes[status] || 'tag';
  }

  isPastOrStarted(apt: Appointment): boolean {
    return this.toDateTime(apt).getTime() <= Date.now();
  }

  canCancel(apt: Appointment): boolean {
    if (this.isPastOrStarted(apt)) {
      return false;
    }
    return apt.status === 'pending_payment' || apt.status === 'confirmed' || apt.status === 'rescheduled';
  }

  canPay(apt: Appointment): boolean {
    if (apt.status !== 'pending_payment') {
      return false;
    }
    if (!apt.paymentDueAt) {
      return true;
    }
    return new Date(apt.paymentDueAt).getTime() > Date.now();
  }

  cancel(apt: Appointment): void {
    if (!this.canCancel(apt)) {
      return;
    }
    this.appointmentsApi.cancel(apt.id).subscribe({
      next: (updated) => {
        this.appointments = this.appointments.map((item) => (item.id === updated.id ? updated : item));
        this.toast.show('Cita cancelada.', 'success');
      },
      error: (err) => {
        this.toast.show(err?.error?.detail || 'No fue posible cancelar.', 'error');
      },
    });
  }

  payDeposit(apt: Appointment): void {
    if (!this.canPay(apt)) {
      return;
    }
    this.appointmentsApi.initPayment(apt.id).subscribe({
      next: (paymentIntent) => {
        this.router.navigate(['/payments/checkout'], {
          queryParams: { reference: paymentIntent.paymentReference, returnTo: '/appointments' },
        });
      },
      error: (err) => {
        this.toast.show(err?.error?.detail || 'No fue posible iniciar el pago del anticipo.', 'error');
      },
    });
  }

  settlementForAppointment(appointmentId: number): ServiceSettlement | undefined {
    return this.settlements.find((settlement) => settlement.appointmentId === appointmentId);
  }

  settlementStatusLabel(status: ServiceSettlement['status']): string {
    const labels: Record<string, string> = {
      pending_settlement: 'Pendiente de liquidación',
      partially_paid: 'Parcialmente pagada',
      settled: 'Liquidada',
      voided: 'Anulada',
    };
    return labels[status] || status;
  }

  settlementStatusClass(status: ServiceSettlement['status']): string {
    const classes: Record<string, string> = {
      pending_settlement: 'tag tag--pending',
      partially_paid: 'tag tag--rescheduled',
      settled: 'tag tag--confirmed',
      voided: 'tag tag--cancelled',
    };
    return classes[status] || 'tag';
  }

  money(value: number | string | null | undefined): string {
    return Number(value || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  latestReceipt(settlement: ServiceSettlement): SettlementReceipt | undefined {
    return this.receipts[settlement.id] || settlement.receipts?.[settlement.receipts.length - 1];
  }

  loadReceipt(settlement: ServiceSettlement): void {
    this.settlementsApi.getReceipt(settlement.id).subscribe({
      next: (receipt) => {
        this.receipts[settlement.id] = receipt;
        this.toast.show(`Comprobante ${receipt.receiptNumber} cargado.`, 'success');
      },
      error: (err) => {
        this.toast.show(err?.error?.detail || 'El comprobante aún no está disponible.', 'error');
      },
    });
  }

  canCreateServiceCase(apt: Appointment): boolean {
    if (apt.status !== 'completed') {
      return false;
    }
    const settlement = this.settlementForAppointment(apt.id);
    if (!settlement || settlement.status !== 'settled') {
      return false;
    }
    return !this.serviceCases.some(
      (item) => item.appointmentId === apt.id && (item.status === 'open' || item.status === 'in_review'),
    );
  }

  serviceCasesForAppointment(appointmentId: number): ServiceCase[] {
    return this.serviceCases.filter((item) => item.appointmentId === appointmentId);
  }

  serviceCaseTypeLabel(caseType: ServiceCase['caseType']): string {
    const labels: Record<string, string> = {
      petition: 'Petición',
      complaint: 'Queja',
      claim: 'Reclamo',
      suggestion: 'Sugerencia',
    };
    return labels[caseType] || caseType;
  }

  serviceCaseStatusLabel(status: ServiceCase['status']): string {
    const labels: Record<string, string> = {
      open: 'Abierta',
      in_review: 'En revisión',
      resolved: 'Resuelta',
      closed: 'Cerrada',
      rejected: 'Rechazada',
    };
    return labels[status] || status;
  }

  serviceCaseStatusClass(status: ServiceCase['status']): string {
    const classes: Record<string, string> = {
      open: 'tag tag--pending',
      in_review: 'tag tag--rescheduled',
      resolved: 'tag tag--confirmed',
      closed: 'tag tag--completed',
      rejected: 'tag tag--cancelled',
    };
    return classes[status] || 'tag';
  }

  pqrsForm(appointmentId: number): { caseType: ServiceCase['caseType']; subject: string; description: string; open: boolean } {
    if (!this.pqrsForms[appointmentId]) {
      this.pqrsForms[appointmentId] = {
        caseType: 'claim',
        subject: '',
        description: '',
        open: false,
      };
    }
    return this.pqrsForms[appointmentId];
  }

  togglePqrsForm(appointmentId: number): void {
    const form = this.pqrsForm(appointmentId);
    form.open = !form.open;
  }

  submitServiceCase(apt: Appointment): void {
    const form = this.pqrsForm(apt.id);
    const subject = form.subject.trim();
    const description = form.description.trim();
    if (subject.length < 5) {
      this.toast.show('El asunto de la PQRS debe tener al menos 5 caracteres.', 'error');
      return;
    }
    if (description.length < 15) {
      this.toast.show('La descripción de la PQRS debe tener al menos 15 caracteres.', 'error');
      return;
    }
    this.supportApi.createMyServiceCase({
      appointmentId: apt.id,
      caseType: form.caseType,
      subject,
      description,
    }).subscribe({
      next: (created) => {
        this.serviceCases = [created, ...this.serviceCases];
        this.pqrsForms[apt.id] = {
          caseType: 'claim',
          subject: '',
          description: '',
          open: false,
        };
        this.toast.show('PQRS registrada correctamente.', 'success');
      },
      error: (err) => {
        this.toast.show(err?.error?.detail || 'No fue posible registrar la PQRS.', 'error');
      },
    });
  }

  private toDateTime(apt: Appointment): Date {
    return new Date(`${apt.date}T${apt.time}:00`);
  }
}
