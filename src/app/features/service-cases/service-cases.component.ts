import { Component, OnInit } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ProfessionalsService } from '../../core/professionals.service';
import { ServicesService } from '../../core/services.service';
import { SupportService } from '../../core/support.service';
import { ToastService } from '../../core/toast.service';
import { EligibleServiceCaseAppointment, Professional, Service, ServiceCase } from '../../core/models';

@Component({
  selector: 'app-service-cases',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, DatePipe, FormsModule],
  templateUrl: './service-cases.component.html',
  styleUrl: './service-cases.component.scss',
})
export class ServiceCasesComponent implements OnInit {
  loading = true;
  eligibleAppointments: EligibleServiceCaseAppointment[] = [];
  serviceCases: ServiceCase[] = [];
  services: Service[] = [];
  professionals: Professional[] = [];
  pqrsForms: Record<number, { caseType: ServiceCase['caseType']; subject: string; description: string; open: boolean }> = {};

  constructor(
    private servicesApi: ServicesService,
    private professionalsApi: ProfessionalsService,
    private supportApi: SupportService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.refreshData();
    this.servicesApi.list().subscribe({
      next: (items) => {
        this.services = items;
      },
      error: () => {
        this.services = [];
      },
    });
    this.professionalsApi.list().subscribe({
      next: (items) => {
        this.professionals = items;
      },
      error: () => {
        this.professionals = [];
      },
    });
  }

  refreshData(): void {
    this.loading = true;
    this.supportApi.listMyEligibleServiceCaseAppointments().subscribe({
      next: (items) => {
        this.eligibleAppointments = items;
        this.loading = false;
      },
      error: () => {
        this.eligibleAppointments = [];
        this.loading = false;
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
    return this.services.find((item) => item.id === serviceId)?.name || 'Servicio';
  }

  getProfessionalName(professionalId: number): string {
    return this.professionals.find((item) => item.id === professionalId)?.name || 'Profesional';
  }

  money(value: number | string | null | undefined): string {
    return Number(value || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
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

  submitServiceCase(appointment: EligibleServiceCaseAppointment): void {
    const form = this.pqrsForm(appointment.id);
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
      appointmentId: appointment.id,
      caseType: form.caseType,
      subject,
      description,
    }).subscribe({
      next: (created) => {
        this.serviceCases = [created, ...this.serviceCases];
        this.eligibleAppointments = this.eligibleAppointments.filter((item) => item.id !== appointment.id);
        this.pqrsForms[appointment.id] = {
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

  showFollowUpSuggestion(serviceCase: ServiceCase): boolean {
    return serviceCase.status === 'resolved' || serviceCase.status === 'closed';
  }
}
