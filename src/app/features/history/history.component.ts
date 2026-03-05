import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AppointmentsService } from '../../core/appointments.service';
import { ServicesService } from '../../core/services.service';
import { ProfessionalsService } from '../../core/professionals.service';
import { ToastService } from '../../core/toast.service';
import { Appointment, Professional, Service } from '../../core/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
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
    forkJoin({
      appointments: this.appointmentsApi.listMine(),
      services: this.servicesApi.list(),
      professionals: this.professionalsApi.list(),
    }).subscribe({
      next: ({ appointments, services, professionals }) => {
        this.appointments = appointments;
        this.services = services;
        this.professionals = professionals;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
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
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      attended: 'Atendida',
      rescheduled: 'Reprogramada',
    };
    return labels[status] || status;
  }

  statusClass(status: Appointment['status']): string {
    const classes: Record<string, string> = {
      confirmed: 'tag tag--confirmed',
      cancelled: 'tag tag--cancelled',
      attended: 'tag tag--attended',
      rescheduled: 'tag tag--rescheduled',
    };
    return classes[status] || 'tag';
  }

  canCancel(status: Appointment['status']): boolean {
    return status === 'confirmed' || status === 'rescheduled';
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
}


