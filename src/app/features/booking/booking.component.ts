import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ServicesService } from '../../core/services.service';
import { ProfessionalsService } from '../../core/professionals.service';
import { AppointmentsService } from '../../core/appointments.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Appointment, Professional, Service } from '../../core/models';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, RouterLink],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
})
export class BookingComponent implements OnInit {
  services: Service[] = [];
  professionals: Professional[] = [];
  selectedService?: Service;
  selectedProfessional?: Professional;
  minDate = this.todayStr();
  date = this.minDate;
  slots: string[] = [];
  selectedTime = '';
  notes = '';
  loadingSlots = false;
  creating = false;
  createdAppointment?: Appointment;

  clientName = '';
  clientEmail = '';
  clientPhone = '';

  constructor(
    private servicesApi: ServicesService,
    private professionalsApi: ProfessionalsService,
    private appointmentsApi: AppointmentsService,
    private auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.servicesApi.list().subscribe((items) => (this.services = items.filter((item) => item.active)));
    this.professionalsApi.list().subscribe((items) => (this.professionals = items.filter((item) => item.active)));

    const user = this.auth.currentUser;
    if (user) {
      this.clientName = user.name || '';
      this.clientEmail = user.email || '';
      this.clientPhone = user.phone || '';
    }
  }

  selectService(service: Service): void {
    this.selectedService = service;
    this.selectedProfessional = undefined;
    this.selectedTime = '';
    this.slots = [];
    this.createdAppointment = undefined;
  }

  selectProfessional(pro: Professional): void {
    this.selectedProfessional = pro;
    this.selectedTime = '';
    this.slots = [];
    this.createdAppointment = undefined;
    this.loadSlots();
  }

  loadSlots(): void {
    if (!this.selectedService || !this.selectedProfessional || !this.date) {
      return;
    }
    this.loadingSlots = true;
    this.appointmentsApi
      .availability(this.selectedService.id, this.selectedProfessional.id, this.date)
      .subscribe({
        next: (slots) => {
          this.slots = slots;
          this.loadingSlots = false;
        },
        error: () => {
          this.slots = [];
          this.loadingSlots = false;
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
      .subscribe({
        next: (apt) => {
          this.creating = false;
          this.createdAppointment = apt;
          this.toast.show('Cita confirmada.', 'success');
        },
        error: (err) => {
          this.creating = false;
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

  private todayStr(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}


