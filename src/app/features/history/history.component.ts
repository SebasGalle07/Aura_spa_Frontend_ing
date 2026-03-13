import { Component, OnInit } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AppointmentsService } from '../../core/appointments.service';
import { ServicesService } from '../../core/services.service';
import { ProfessionalsService } from '../../core/professionals.service';
import { ToastService } from '../../core/toast.service';
import { Appointment, Professional, Service } from '../../core/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, DatePipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
  appointments: Appointment[] = [];
  services: Service[] = [];
  professionals: Professional[] = [];
  loading = true;

  constructor(
    private appointmentsApi: AppointmentsService,
    private servicesApi: ServicesService,
    private professionalsApi: ProfessionalsService,
    private toast: ToastService,
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

  canCancel(status: Appointment['status']): boolean {
    return status === 'pending_payment' || status === 'confirmed' || status === 'rescheduled';
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
    if (!this.canCancel(apt.status)) {
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
    this.appointmentsApi.mockApprovePayment(apt.id).subscribe({
      next: (updated) => {
        this.appointments = this.appointments.map((item) => (item.id === updated.id ? updated : item));
        this.toast.show('Pago aprobado. Reserva confirmada.', 'success');
      },
      error: (err) => {
        this.toast.show(err?.error?.detail || 'No fue posible pagar el anticipo.', 'error');
      },
    });
  }
}
