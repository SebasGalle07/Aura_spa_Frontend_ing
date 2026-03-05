import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;
  showPassword = false;
  showConfirm = false;
  submitted = false;
  touched = {
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false,
  };
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  submit(): void {
    this.submitted = true;
    this.error = '';
    if (!this.canSubmit) {
      this.error = 'Revisa los campos obligatorios.';
      return;
    }

    this.loading = true;
    this.auth
      .register({ name: this.name, email: this.email, phone: this.phone || undefined, password: this.password })
      .subscribe({
        next: () => {
          this.loading = false;
          this.toast.show('Cuenta creada con exito.', 'success');
          this.router.navigate(['/book']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.detail || 'No fue posible registrarte.';
        },
      });
  }

  markTouched(field: keyof RegisterComponent['touched']): void {
    this.touched[field] = true;
  }

  get emailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  get passwordMinOk(): boolean {
    return this.password.length >= 8;
  }

  get passwordMaxOk(): boolean {
    return new TextEncoder().encode(this.password).length <= 72;
  }

  get passwordsMatch(): boolean {
    return !!this.password && !!this.confirmPassword && this.password === this.confirmPassword;
  }

  get canSubmit(): boolean {
    return (
      !!this.name &&
      this.emailValid &&
      this.passwordMinOk &&
      this.passwordMaxOk &&
      this.passwordsMatch &&
      this.acceptTerms
    );
  }
}


