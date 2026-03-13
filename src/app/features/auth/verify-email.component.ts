import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent {
  loading = true;
  success = false;
  error = '';

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
    route: ActivatedRoute,
  ) {
    const token = route.snapshot.queryParamMap.get('token') || '';
    if (!token) {
      this.loading = false;
      this.error = 'El enlace de verificacion es invalido.';
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.toast.show('Correo verificado. Ya puedes iniciar sesion.', 'success');
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail || 'No fue posible verificar tu correo.';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
