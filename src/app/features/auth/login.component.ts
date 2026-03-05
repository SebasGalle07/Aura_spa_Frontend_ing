import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  submitted = false;
  touched = {
    email: false,
    password: false,
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
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.toast.show('Bienvenido a Aura Spa.', 'success');
        this.router.navigate(['/book']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail || 'Credenciales incorrectas.';
      },
    });
  }

  markTouched(field: keyof LoginComponent['touched']): void {
    this.touched[field] = true;
  }

  get emailValid(): boolean {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(this.email);
  }

  get canSubmit(): boolean {
    return !!this.email && this.emailValid && !!this.password;
  }
}


