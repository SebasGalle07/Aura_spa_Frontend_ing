import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { environment } from '../../../environments/environment';
import { DigitsOnlyDirective } from '../../shared/digits-only.directive';
import { LettersOnlyDirective } from '../../shared/letters-only.directive';

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
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf, DigitsOnlyDirective, LettersOnlyDirective],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements AfterViewInit {
  @ViewChild('googleButtonHost') private googleButtonHost?: ElementRef<HTMLDivElement>;

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
    phone: false,
    password: false,
    confirmPassword: false,
    terms: false,
  };
  error = '';
  loading = false;
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
    if (!this.canSubmit) {
      this.error = 'Revisa los campos obligatorios.';
      return;
    }

    this.loading = true;
    this.auth
      .register({ name: this.name.trim(), email: this.email.trim(), phone: this.phone.trim(), password: this.password })
      .subscribe({
        next: () => {
          this.loading = false;
          this.toast.show('Cuenta creada. Revisa tu correo para activarla.', 'success');
          this.router.navigate(['/login']);
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

  onNameInput(): void {
    this.name = this.name
      .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\-\s]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trimStart();
  }

  get nameValid(): boolean {
    const cleanName = this.name.trim();
    return !!cleanName && /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(cleanName);
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

  get passwordUppercaseOk(): boolean {
    return /[A-Z]/.test(this.password);
  }

  get passwordLowercaseOk(): boolean {
    return /[a-z]/.test(this.password);
  }

  get passwordDigitOk(): boolean {
    return /\d/.test(this.password);
  }

  get passwordSpecialOk(): boolean {
    return /[^A-Za-z0-9]/.test(this.password);
  }

  get passwordsMatch(): boolean {
    return !!this.password && !!this.confirmPassword && this.password === this.confirmPassword;
  }

  get canSubmit(): boolean {
    return (
      !!this.name &&
      this.nameValid &&
      this.emailValid &&
      !!this.phone.trim() &&
      this.passwordMinOk &&
      this.passwordMaxOk &&
      this.passwordUppercaseOk &&
      this.passwordLowercaseOk &&
      this.passwordDigitOk &&
      this.passwordSpecialOk &&
      this.passwordsMatch &&
      this.acceptTerms
    );
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
        this.toast.show('Cuenta iniciada con Google.', 'success');
        this.router.navigate(['/book']);
      },
      error: (err) => {
        this.googleLoading = false;
        this.error = err?.error?.detail || 'No fue posible iniciar sesion con Google.';
      },
    });
  }
}
