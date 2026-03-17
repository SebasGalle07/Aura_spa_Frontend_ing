import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, Location, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ServicesService } from '../../core/services.service';
import { ProfessionalsService } from '../../core/professionals.service';
import { AppointmentsService } from '../../core/appointments.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Appointment, AppointmentPaymentInitResponse, Professional, Service } from '../../core/models';
import { DigitsOnlyDirective } from '../../shared/digits-only.directive';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, RouterLink, DigitsOnlyDirective, DatePipe],
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
  processingPayment = false;
  createdAppointment?: Appointment;
  paymentIntent?: AppointmentPaymentInitResponse;
  requestedServiceId: number | null = null;

  clientName = '';
  clientEmail = '';
  clientPhone = '';

  private readonly draftKey = 'aura_spa_booking_draft_v1';

  constructor(
    private servicesApi: ServicesService,
    private professionalsApi: ProfessionalsService,
    private appointmentsApi: AppointmentsService,
    private auth: AuthService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
  ) {}

  ngOnInit(): void {
    this.clearLegacyDraft();
    this.resetBookingState();

    const user = this.auth.currentUser;
    if (user) {
      this.clientName = user.name || '';
      this.clientEmail = user.email || '';
      this.clientPhone = user.phone || '';
    }

    this.route.queryParamMap.subscribe((params) => {
      const raw = params.get('service');
      const parsed = raw ? Number(raw) : NaN;
      if (Number.isFinite(parsed) && parsed > 0) {
        this.requestedServiceId = parsed;
      } else {
        this.requestedServiceId = null;
      }
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
  }

  selectService(service: Service, options: { skipScroll?: boolean } = {}): void {
    this.selectedService = service;
    this.detailService = undefined;
    this.selectedProfessional = undefined;
    this.selectedTime = '';
    this.slots = [];
    this.createdAppointment = undefined;
    this.paymentIntent = undefined;
    this.loadProfessionalsForService(service.id);
    if (!options.skipScroll) {
      this.scrollToStep('step-professional');
    }
  }

  selectProfessional(pro: Professional, options: { skipScroll?: boolean } = {}): void {
    this.selectedProfessional = pro;
    this.selectedTime = '';
    this.slots = [];
    this.createdAppointment = undefined;
    this.paymentIntent = undefined;
    this.loadSlots();
    if (!options.skipScroll) {
      this.scrollToStep('step-schedule');
    }
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
          this.toast.show('Reserva creada. Debes pagar el anticipo para confirmarla.', 'success');
          this.startDepositPayment(apt.id);
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

  startNewBooking(): void {
    this.resetBookingState();
    const user = this.auth.currentUser;
    if (user) {
      this.clientName = user.name || '';
      this.clientEmail = user.email || '';
      this.clientPhone = user.phone || '';
    }
  }

  payDeposit(): void {
    if (!this.createdAppointment) {
      return;
    }
    if (this.paymentIntent?.paymentReference) {
      this.router.navigate(['/payments/checkout'], {
        queryParams: { reference: this.paymentIntent.paymentReference, returnTo: '/appointments' },
      });
      return;
    }

    this.processingPayment = true;
    this.appointmentsApi
      .initPayment(this.createdAppointment.id)
      .pipe(finalize(() => (this.processingPayment = false)))
      .subscribe({
        next: (paymentIntent) => {
          this.paymentIntent = paymentIntent;
          this.router.navigate(['/payments/checkout'], {
            queryParams: { reference: paymentIntent.paymentReference, returnTo: '/appointments' },
          });
        },
        error: (err) => {
          this.toast.show(err?.error?.detail || 'No fue posible iniciar el pago del anticipo.', 'error');
        },
      });
  }

  isPaymentExpired(): boolean {
    const dueAt = this.paymentIntent?.paymentDueAt || this.createdAppointment?.paymentDueAt || null;
    if (!dueAt) {
      return false;
    }
    return new Date(dueAt).getTime() <= Date.now();
  }

  goBackNavigation(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigate(['/']);
  }

  backToServiceStep(): void {
    this.scrollToStep('step-service');
  }

  backToProfessionalStep(): void {
    this.scrollToStep('step-professional');
  }

  backToScheduleStep(): void {
    this.scrollToStep('step-schedule');
  }

  onClientDataChanged(): void {
    return;
  }

  describe(service: Service): string {
    const byCategory: Record<string, string> = {
      masajes: 'Terapia orientada a liberar tension muscular y reducir el estres.',
      manicure: 'Cuidado estetico de manos con enfoque en limpieza, forma y acabado.',
      pedicure: 'Tratamiento integral para pies, hidratacion profunda y relajacion.',
      facial: 'Rutina de limpieza e hidratacion para mejorar textura y luminosidad.',
      depilacion: 'Procedimiento profesional para remover vello con cuidado de la piel.',
      corporal: 'Experiencia para renovar energia, aliviar fatiga y mejorar bienestar.',
    };
    const categoryKey = (service.category || '').trim().toLowerCase();
    return (
      byCategory[categoryKey] ||
      `Servicio de ${service.category.toLowerCase()} de ${service.duration} minutos con atencion profesional personalizada.`
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
      this.selectService(requested, { skipScroll: false });
      this.requestedServiceId = null;
    }
  }

  private resetBookingState(): void {
    this.selectedService = undefined;
    this.detailService = undefined;
    this.selectedProfessional = undefined;
    this.date = this.minDate;
    this.slots = [];
    this.selectedTime = '';
    this.notes = '';
    this.createdAppointment = undefined;
    this.paymentIntent = undefined;
  }

  private clearLegacyDraft(): void {
    sessionStorage.removeItem(this.draftKey);
  }

  private scrollToStep(stepId: string): void {
    setTimeout(() => {
      const element = document.getElementById(stepId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  }

  private startDepositPayment(appointmentId: number): void {
    this.appointmentsApi.initPayment(appointmentId).subscribe({
      next: (paymentIntent) => {
        this.paymentIntent = paymentIntent;
      },
      error: (err) => {
        this.paymentIntent = undefined;
        this.toast.show(err?.error?.detail || 'No fue posible iniciar el pago del anticipo.', 'error');
      },
    });
  }
}
