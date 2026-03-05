import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';

import { AdminService, AdminSummary } from '../../core/admin.service';
import { AppointmentsService } from '../../core/appointments.service';
import { ServicesService } from '../../core/services.service';
import { ProfessionalsService } from '../../core/professionals.service';
import { UsersService } from '../../core/users.service';
import { CompanyService } from '../../core/company.service';
import { ToastService } from '../../core/toast.service';
import { Appointment, Branding, CompanyData, Professional, Service, User } from '../../core/models';
import { mapAppointmentFromApi } from '../../core/api-mappers';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  tab: 'summary' | 'appointments' | 'services' | 'professionals' | 'users' | 'company' = 'summary';

  summary?: AdminSummary;
  agenda: Appointment[] = [];

  appointments: Appointment[] = [];
  services: Service[] = [];
  professionals: Professional[] = [];
  users: User[] = [];

  serviceForm: Partial<Service> = { name: '', category: '', duration: 60, price: 0, active: true };
  editingServiceId?: number;

  professionalForm: Partial<Professional> = { name: '', specialty: '', scheduleStart: '09:00', scheduleEnd: '17:00', active: true };
  editingProfessionalId?: number;

  userForm: Partial<User> & { password?: string } = { name: '', email: '', role: 'client', phone: '', password: '' };
  editingUserId?: number;

  companyForm: CompanyData = {};
  brandingForm: Branding & { landingImages: { section1: string; section2: string; section3: string } } = {
    spLogo: '',
    landingImages: { section1: '', section2: '', section3: '' },
  };

  rescheduleId?: number;
  rescheduleDate = '';
  rescheduleTime = '';

  constructor(
    private adminApi: AdminService,
    private appointmentsApi: AppointmentsService,
    private servicesApi: ServicesService,
    private professionalsApi: ProfessionalsService,
    private usersApi: UsersService,
    private companyApi: CompanyService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadSummary();
    this.refreshAll();
    this.loadCompany();
  }

  setTab(tab: 'summary' | 'appointments' | 'services' | 'professionals' | 'users' | 'company'): void {
    this.tab = tab;
  }

  loadSummary(): void {
    this.adminApi.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.agenda = (summary.agenda || []).map((item) => mapAppointmentFromApi(item as Record<string, unknown>));
      },
    });
  }

  refreshAll(): void {
    this.refreshAppointments();
    this.servicesApi.list().subscribe((items) => (this.services = items));
    this.professionalsApi.list().subscribe((items) => (this.professionals = items));
    this.usersApi.list().subscribe((items) => (this.users = items));
  }

  refreshAppointments(): void {
    this.appointmentsApi.listAll().subscribe((items) => (this.appointments = items));
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

  confirm(apt: Appointment): void {
    this.appointmentsApi.confirm(apt.id).subscribe((updated) => this.updateAppointment(updated, 'Cita confirmada.'));
  }

  attend(apt: Appointment): void {
    this.appointmentsApi.attend(apt.id).subscribe((updated) => this.updateAppointment(updated, 'Cita atendida.'));
  }

  cancel(apt: Appointment): void {
    this.appointmentsApi.cancel(apt.id).subscribe((updated) => this.updateAppointment(updated, 'Cita cancelada.'));
  }

  openReschedule(apt: Appointment): void {
    this.rescheduleId = apt.id;
    this.rescheduleDate = apt.date;
    this.rescheduleTime = apt.time;
  }

  saveReschedule(): void {
    if (!this.rescheduleId) {
      return;
    }
    this.appointmentsApi.reschedule(this.rescheduleId, this.rescheduleDate, this.rescheduleTime).subscribe({
      next: (updated) => {
        this.updateAppointment(updated, 'Cita reprogramada.');
        this.rescheduleId = undefined;
      },
      error: (err) => {
        this.toast.show(err?.error?.detail || 'No fue posible reprogramar.', 'error');
      },
    });
  }

  updateAppointment(updated: Appointment, message: string): void {
    this.appointments = this.appointments.map((item) => (item.id === updated.id ? updated : item));
    this.toast.show(message, 'success');
  }

  editService(service: Service): void {
    this.editingServiceId = service.id;
    this.serviceForm = { ...service };
  }

  resetServiceForm(): void {
    this.editingServiceId = undefined;
    this.serviceForm = { name: '', category: '', duration: 60, price: 0, active: true };
  }

  saveService(): void {
    const payload = { ...this.serviceForm };
    if (this.editingServiceId) {
      this.servicesApi.update(this.editingServiceId, payload).subscribe((updated) => {
        this.services = this.services.map((item) => (item.id === updated.id ? updated : item));
        this.toast.show('Servicio actualizado.', 'success');
        this.resetServiceForm();
      });
    } else {
      this.servicesApi.create(payload).subscribe((created) => {
        this.services = [created, ...this.services];
        this.toast.show('Servicio creado.', 'success');
        this.resetServiceForm();
      });
    }
  }

  editProfessional(pro: Professional): void {
    this.editingProfessionalId = pro.id;
    this.professionalForm = { ...pro };
  }

  resetProfessionalForm(): void {
    this.editingProfessionalId = undefined;
    this.professionalForm = { name: '', specialty: '', scheduleStart: '09:00', scheduleEnd: '17:00', active: true };
  }

  saveProfessional(): void {
    const payload = { ...this.professionalForm };
    if (this.editingProfessionalId) {
      this.professionalsApi.update(this.editingProfessionalId, payload).subscribe((updated) => {
        this.professionals = this.professionals.map((item) => (item.id === updated.id ? updated : item));
        this.toast.show('Profesional actualizado.', 'success');
        this.resetProfessionalForm();
      });
    } else {
      this.professionalsApi.create(payload).subscribe((created) => {
        this.professionals = [created, ...this.professionals];
        this.toast.show('Profesional creado.', 'success');
        this.resetProfessionalForm();
      });
    }
  }

  editUser(user: User): void {
    this.editingUserId = user.id;
    this.userForm = { ...user, password: '' };
  }

  resetUserForm(): void {
    this.editingUserId = undefined;
    this.userForm = { name: '', email: '', role: 'client', phone: '', password: '' };
  }

  saveUser(): void {
    const payload = { ...this.userForm };
    if (this.editingUserId) {
      this.usersApi.update(this.editingUserId, payload).subscribe({
        next: (updated) => {
          this.users = this.users.map((item) => (item.id === updated.id ? updated : item));
          this.toast.show('Usuario actualizado.', 'success');
          this.resetUserForm();
        },
        error: (err) => {
          this.toast.show(err?.error?.detail || 'No fue posible guardar.', 'error');
        },
      });
    } else {
      if (!payload.password) {
        this.toast.show('La contrasena es obligatoria.', 'error');
        return;
      }
      this.usersApi.create(payload as { password: string } & Partial<User>).subscribe({
        next: (created) => {
          this.users = [created, ...this.users];
          this.toast.show('Usuario creado.', 'success');
          this.resetUserForm();
        },
        error: (err) => {
          this.toast.show(err?.error?.detail || 'No fue posible crear.', 'error');
        },
      });
    }
  }

  deleteUser(user: User): void {
    this.usersApi.remove(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((item) => item.id !== user.id);
        this.toast.show('Usuario eliminado.', 'success');
      },
      error: (err) => {
        this.toast.show(err?.error?.detail || 'No fue posible eliminar.', 'error');
      },
    });
  }

  loadCompany(): void {
    this.companyApi.fetchAdminCompany().subscribe((company) => (this.companyForm = { ...company }));
    this.companyApi.fetchAdminBranding().subscribe((branding) => {
      this.brandingForm = {
        spLogo: branding.spLogo || '',
        landingImages: {
          section1: branding.landingImages?.section1 || '',
          section2: branding.landingImages?.section2 || '',
          section3: branding.landingImages?.section3 || '',
        },
      };
    });
  }

  saveCompany(): void {
    this.companyApi.updateAdminCompany(this.companyForm).subscribe({
      next: () => this.toast.show('Datos de empresa actualizados.', 'success'),
      error: (err) => this.toast.show(err?.error?.detail || 'No fue posible actualizar.', 'error'),
    });
  }

  saveBranding(): void {
    this.companyApi.updateAdminBranding(this.brandingForm).subscribe({
      next: () => this.toast.show('Branding actualizado.', 'success'),
      error: (err) => this.toast.show(err?.error?.detail || 'No fue posible actualizar.', 'error'),
    });
  }
}


