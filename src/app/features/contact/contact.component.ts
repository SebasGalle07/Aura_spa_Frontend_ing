import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, NgIf } from '@angular/common';
import { Observable } from 'rxjs';

import { CompanyService } from '../../core/company.service';
import { ToastService } from '../../core/toast.service';
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

  constructor(private company: CompanyService, private toast: ToastService) {
    this.company$ = this.company.company$;
  }

  submit(): void {
    if (!this.name || !this.email || !this.message) {
      this.toast.show('Completa todos los campos.', 'error');
      return;
    }
    this.toast.show('Gracias. Te contactaremos pronto.', 'success');
    this.name = '';
    this.email = '';
    this.message = '';
  }
}


