import { Component, OnInit } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ServicesService } from '../../core/services.service';
import { CompanyService } from '../../core/company.service';
import { AuthService } from '../../core/auth.service';
import { Branding, Service } from '../../core/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, NgIf, AsyncPipe, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  services: Service[] = [];
  featured: Service[] = [];
  loading = true;

  branding$: Observable<Branding | null>;

  constructor(
    private servicesApi: ServicesService,
    private company: CompanyService,
    private auth: AuthService,
  ) {
    this.branding$ = this.company.branding$;
  }

  ngOnInit(): void {
    this.servicesApi.list().subscribe({
      next: (items) => {
        this.services = items.filter((item) => item.active);
        this.featured = this.services.slice(0, 4);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value || 0);
  }
}


