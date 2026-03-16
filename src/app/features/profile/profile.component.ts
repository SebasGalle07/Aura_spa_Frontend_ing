import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

import { AuthService } from '../../core/auth.service';
import { UsersService } from '../../core/users.service';
import { AppointmentsService } from '../../core/appointments.service';
import { ToastService } from '../../core/toast.service';
import { User } from '../../core/models';
import { DigitsOnlyDirective } from '../../shared/digits-only.directive';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, NgIf, DigitsOnlyDirective],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  user?: User | null;
  name = '';
  email = '';
  phone = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  totalAppointments = 0;
  completedAppointments = 0;

  saving = false;
  changing = false;

  constructor(
    private auth: AuthService,
    private usersApi: UsersService,
    private appointmentsApi: AppointmentsService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    if (this.user) {
      this.name = this.user.name;
      this.email = this.user.email;
      this.phone = this.user.phone || '';
    }

    this.appointmentsApi.listMine().subscribe((appointments) => {
      this.totalAppointments = appointments.length;
      this.completedAppointments = appointments.filter((apt) => apt.status === 'completed').length;
    });
  }

  saveProfile(): void {
    if (!this.user) {
      return;
    }
    this.saving = true;
    this.usersApi.updateMe({ name: this.name, email: this.email, phone: this.phone }).subscribe({
      next: (user) => {
        this.saving = false;
        this.user = user;
        this.auth.syncCurrentUser(user);
        this.toast.show(
          user.emailVerified === false
            ? 'Perfil actualizado. Verifica tu nuevo correo para mantener el acceso.'
            : 'Perfil actualizado.',
          'success',
        );
      },
      error: (err) => {
        this.saving = false;
        this.toast.show(err?.error?.detail || 'No fue posible actualizar.', 'error');
      },
    });
  }

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.toast.show('Completa todos los campos.', 'error');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toast.show('Las contraseñas no coinciden.', 'error');
      return;
    }
    this.changing = true;
    this.usersApi
      .changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword })
      .subscribe({
        next: () => {
          this.changing = false;
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.toast.show('Contraseña actualizada.', 'success');
        },
        error: (err) => {
          this.changing = false;
          this.toast.show(err?.error?.detail || 'No fue posible cambiar la contraseña.', 'error');
        },
      });
  }

  roleLabel(role?: User['role']): string {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      client: 'Cliente',
      professional: 'Profesional',
    };
    return role ? labels[role] || role : '';
  }
}




