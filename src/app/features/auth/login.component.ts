import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { environment } from '../../../environments/environment';

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            ux_mode?: 'popup' | 'redirect';
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleButtonHost') private googleButtonHost?: ElementRef<HTMLDivElement>;

  email = '';
  password = '';
  submitted = false;
  touched = {
    email: false,
    password: false,
  };
  error = '';
  loading = false;
  resendLoading = false;
  showResendVerification = false;
  googleLoading = false;
  googleReady = false;
  readonly googleEnabled = !!environment.googleClientId?.trim();
  private readonly googleScriptId = 'google-gsi-script';

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  ngAfterViewInit(): void {
    if (this.googleEnabled) {
      this.setupGoogleSignIn();
    }
  }

  submit(): void {
    this.submitted = true;
    this.error = '';
    this.showResendVerification = false;
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
        this.showResendVerification = (this.error || '').toLowerCase().includes('verificar tu correo');
      },
    });
  }

  resendVerification(): void {
    if (!this.emailValid || this.resendLoading) {
      return;
    }

    this.resendLoading = true;
    this.auth.resendVerification(this.email).subscribe({
      next: () => {
        this.resendLoading = false;
        this.toast.show('Te enviamos un nuevo correo de verificacion.', 'info');
      },
      error: (err) => {
        this.resendLoading = false;
        this.error = err?.error?.detail || 'No fue posible reenviar la verificacion.';
      },
    });
  }

  markTouched(field: keyof LoginComponent['touched']): void {
    this.touched[field] = true;
  }

  get emailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  get canSubmit(): boolean {
    return !!this.email && this.emailValid && !!this.password;
  }

  private async setupGoogleSignIn(): Promise<void> {
    try {
      await this.loadGoogleScript();
      this.renderGoogleButton();
    } catch {
      this.error = 'No fue posible cargar el acceso con Google.';
    }
  }

  private loadGoogleScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    const existing = document.getElementById(this.googleScriptId) as HTMLScriptElement | null;
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Google script error')), { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = this.googleScriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google script error'));
      document.head.appendChild(script);
    });
  }

  private renderGoogleButton(): void {
    if (!this.googleEnabled || !this.googleButtonHost?.nativeElement || !window.google?.accounts?.id) {
      return;
    }

    const googleId = window.google.accounts.id;
    googleId.initialize({
      client_id: environment.googleClientId,
      callback: (response) => this.handleGoogleCredential(response),
      ux_mode: 'popup',
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    const host = this.googleButtonHost.nativeElement;
    host.innerHTML = '';
    googleId.renderButton(host, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      locale: 'es',
      width: 360,
    });
    this.googleReady = true;
  }

  private handleGoogleCredential(response: GoogleCredentialResponse): void {
    const credential = response?.credential;
    if (!credential) {
      this.error = 'No se pudo obtener la credencial de Google.';
      return;
    }

    this.error = '';
    this.googleLoading = true;
    this.auth.loginWithGoogle(credential).subscribe({
      next: () => {
        this.googleLoading = false;
        this.toast.show('Bienvenido a Aura Spa.', 'success');
        this.router.navigate(['/book']);
      },
      error: (err) => {
        this.googleLoading = false;
        this.error = err?.error?.detail || 'No fue posible iniciar sesion con Google.';
      },
    });
  }
}
