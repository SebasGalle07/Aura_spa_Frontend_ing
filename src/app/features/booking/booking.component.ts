import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ServicesService } from '../../core/services.service';
import { ProfessionalsService } from '../../core/professionals.service';
import { AppointmentsService } from '../../core/appointments.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Appointment, Professional, Service } from '../../core/models';
import { DigitsOnlyDirective } from '../../shared/digits-only.directive';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, RouterLink, DigitsOnlyDirective],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
})
export class BookingComponent implements OnInit {
  services: Service[] = [];
  professionals: Professional[] = [];
  selectedService?: Service;
  detailService?: Service;
  selectedProfessional?: Professional;
  minDate = this.todayStr();
  date = this.minDate;
  slots: string[] = [];
  selectedTime = '';
  notes = '';
  loadingServices = true;
  loadingProfessionals = false;
  loadingSlots = false;
  creating = false;
  createdAppointment?: Appointment;
  requestedServiceId: number | null = null;

  clientName = '';
  clientEmail = '';
  clientPhone = '';

  constructor(
    private servicesApi: ServicesService,
    private professionalsApi: ProfessionalsService,
    private appointmentsApi: AppointmentsService,
    private auth: AuthService,
    private toast: ToastService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const raw = params.get('service');
      const parsed = raw ? Number(raw) : NaN;
      this.requestedServiceId = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      this.tryPreselectService();
    });

    this.servicesApi
      .list()
      .pipe(finalize(() => (this.loadingServices = false)))
      .subscribe({
        next: (items) => {
          this.services = items.filter((item) => item.active);
          this.tryPreselectService();
        },
        error: () => {
          this.services = [];
          this.toast.show('No fue posible cargar servicios. Intenta de nuevo.', 'error');
        },
      });

    const user = this.auth.currentUser;
    if (user) {
      this.clientName = user.name || '';
      this.clientEmail = user.email || '';
      this.clientPhone = user.phone || '';
    }
  }

  selectService(service: Service): void {
    this.selectedService = service;
    this.detailService = undefined;
    this.selectedProfessional = undefined;
    this.selectedTime = '';
    this.slots = [];
    this.createdAppointment = undefined;
    this.loadProfessionalsForService(service.id);
    this.scrollToStep('step-professional');
  }

  selectProfessional(pro: Professional): void {
    this.selectedProfessional = pro;
    this.selectedTime = '';
    this.slots = [];
    this.createdAppointment = undefined;
    this.loadSlots();
    this.scrollToStep('step-schedule');
  }

  onDateChanged(): void {
    this.selectedTime = '';
    this.slots = [];
    if (this.selectedService && this.selectedProfessional) {
      this.loadSlots();
    }
  }

  loadSlots(): void {
    if (!this.selectedService || !this.selectedProfessional || !this.date) {
      return;
    }
    this.loadingSlots = true;
    this.appointmentsApi
      .availability(this.selectedService.id, this.selectedProfessional.id, this.date)
      .pipe(finalize(() => (this.loadingSlots = false)))
      .subscribe({
        next: (slots) => {
          this.slots = slots;
        },
        error: () => {
          this.slots = [];
          this.toast.show('No fue posible cargar horarios. Intenta de nuevo.', 'error');
        },
      });
  }

  confirmBooking(): void {
    if (!this.selectedService || !this.selectedProfessional || !this.date || !this.selectedTime) {
      this.toast.show('Selecciona servicio, profesional, fecha y hora.', 'error');
      return;
    }
    this.creating = true;
    this.appointmentsApi
      .create({
        serviceId: this.selectedService.id,
        professionalId: this.selectedProfessional.id,
        date: this.date,
        time: this.selectedTime,
        clientName: this.clientName,
        clientEmail: this.clientEmail,
        clientPhone: this.clientPhone,
        notes: this.notes,
      })
      .pipe(finalize(() => (this.creating = false)))
      .subscribe({
        next: (apt) => {
          this.createdAppointment = apt;
          this.toast.show('Reserva creada con éxito.', 'success');
          this.selectedTime = '';
          this.notes = '';
          this.slots = this.slots.filter((slot) => slot !== apt.time);
        },
        error: (err) => {
          const msg = err?.error?.detail || 'No fue posible crear la cita.';
          this.toast.show(msg, 'error');
        },
      });
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  openDetails(service: Service): void {
    this.detailService = service;
  }

  closeDetails(): void {
    this.detailService = undefined;
  }

  selectFromDetails(service: Service): void {
    this.selectService(service);
    this.closeDetails();
  }

  selectTime(slot: string): void {
    this.selectedTime = slot;
    this.scrollToStep('step-confirmation');
  }

  describe(service: Service): string {
    const byCategory: Record<string, string> = {
      masajes: 'Terapia orientada a liberar tensión muscular y reducir el estrés.',
      manicure: 'Cuidado estético de manos con enfoque en limpieza, forma y acabado.',
      pedicure: 'Tratamiento integral para pies, hidratación profunda y relajación.',
      facial: 'Rutina de limpieza e hidratación para mejorar textura y luminosidad.',
      depilacion: 'Procedimiento profesional para remover vello con cuidado de la piel.',
      corporal: 'Experiencia para renovar energía, aliviar fatiga y mejorar bienestar.',
    };
    const categoryKey = (service.category || '').trim().toLowerCase();
    return (
      byCategory[categoryKey] ||
      `Servicio de ${service.category.toLowerCase()} de ${service.duration} minutos con atención profesional personalizada.`
    );
  }

  private loadProfessionalsForService(serviceId: number): void {
    this.loadingProfessionals = true;
    this.professionalsApi
      .list(false, serviceId)
      .pipe(finalize(() => (this.loadingProfessionals = false)))
      .subscribe({
        next: (items) => {
          this.professionals = items.filter((item) => item.active);
        },
        error: () => {
          this.professionals = [];
          this.toast.show('No fue posible cargar profesionales para este servicio.', 'error');
        },
      });
  }

  private todayStr(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private tryPreselectService(): void {
    if (!this.requestedServiceId || !this.services.length) {
      return;
    }
    const requested = this.services.find((service) => service.id === this.requestedServiceId);
    if (requested) {
      this.selectService(requested);
      this.requestedServiceId = null;
    }
  }

  private scrollToStep(stepId: string): void {
    setTimeout(() => {
      const element = document.getElementById(stepId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  }
}
