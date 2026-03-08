import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, NgIf } from '@angular/common';
import { Observable, finalize } from 'rxjs';

import { CompanyService } from '../../core/company.service';
import { ToastService } from '../../core/toast.service';
import { ContactService } from '../../core/contact.service';
import { CompanyData } from '../../core/models';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, AsyncPipe, NgIf],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  company$: Observable<CompanyData | null>;
  name = '';
  email = '';
  message = '';
  sending = false;
  readonly defaultWhatsapp = '3005939785';
  readonly defaultAddress = 'Cra. 14 #21-35, Centro, Armenia, Quindio, Colombia';

  constructor(private company: CompanyService, private contactApi: ContactService, private toast: ToastService) {
    this.company$ = this.company.company$;
  }

  submit(): void {
    if (!this.name || !this.email || !this.message) {
      this.toast.show('Completa todos los campos.', 'error');
      return;
    }

    this.sending = true;
    this.contactApi
      .sendMessage({ name: this.name, email: this.email, message: this.message })
      .pipe(finalize(() => (this.sending = false)))
      .subscribe({
        next: () => {
          this.toast.show('Mensaje enviado al correo de atencion. Te responderemos pronto.', 'success');
          this.name = '';
          this.email = '';
          this.message = '';
        },
        error: (err) => {
          this.toast.show(err?.error?.detail || 'No fue posible enviar el mensaje.', 'error');
        },
      });
  }

  whatsappLink(company: CompanyData | null): string {
    const raw = (company?.whatsapp || this.defaultWhatsapp || '').trim();
    const digits = raw.replace(/\D/g, '');
    const phone = digits.startsWith('57') ? digits : `57${digits}`;
    const text = encodeURIComponent('Hola Aura Spa, quiero información de una cita.');
    return `https://wa.me/${phone}?text=${text}`;
  }

  mapsLink(address?: string | null): string {
    const finalAddress = (address || this.defaultAddress).trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalAddress)}`;
  }
}


