import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  email = '';
  resetToken = '';
  newPassword = '';
  confirmPassword = '';
  loadingRequest = false;
  loadingReset = false;
  requestDone = false;
  error = '';

  constructor(private auth: AuthService, private toast: ToastService, route: ActivatedRoute) {
    this.resetToken = route.snapshot.queryParamMap.get('token') || '';
    this.requestDone = !!this.resetToken;
  }

  requestReset(): void {
    this.error = '';
    if (!this.emailValid) {
      this.error = 'Ingresa un correo valido.';
      return;
    }
    this.loadingRequest = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: ({ resetToken }) => {
        this.loadingRequest = false;
        this.requestDone = true;
        if (resetToken) {
          this.resetToken = resetToken;
        }
        this.toast.show('Si el correo existe, enviamos instrucciones de recuperacion.', 'info');
      },
      error: (err) => {
        this.loadingRequest = false;
        this.error = err?.error?.detail || 'No fue posible generar la recuperacion.';
      },
    });
  }

  submitReset(): void {
    this.error = '';
    if (!this.canReset) {
      this.error = 'Revisa token y nueva contrasena.';
      return;
    }
    this.loadingReset = true;
    this.auth.resetPassword(this.resetToken, this.newPassword).subscribe({
      next: () => {
        this.loadingReset = false;
        this.toast.show('Contrasena actualizada. Ahora puedes iniciar sesion.', 'success');
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.loadingReset = false;
        this.error = err?.error?.detail || 'No fue posible restablecer la contrasena.';
      },
    });
  }

  get emailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  get passwordMinOk(): boolean {
    return this.newPassword.length >= 8;
  }

  get passwordMaxOk(): boolean {
    return new TextEncoder().encode(this.newPassword).length <= 72;
  }

  get passwordsMatch(): boolean {
    return !!this.newPassword && !!this.confirmPassword && this.newPassword === this.confirmPassword;
  }

  get canReset(): boolean {
    return !!this.resetToken && this.passwordMinOk && this.passwordMaxOk && this.passwordsMatch;
  }
}
