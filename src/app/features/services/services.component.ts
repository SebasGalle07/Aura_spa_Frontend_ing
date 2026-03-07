import { Component, HostListener, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ServicesService } from '../../core/services.service';
import { AuthService } from '../../core/auth.service';
import { Service } from '../../core/models';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  filtered: Service[] = [];
  categories: string[] = [];
  category = 'Todas';
  loading = true;
  detailService?: Service;

  constructor(
    private servicesApi: ServicesService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.servicesApi.list().subscribe({
      next: (items) => {
        this.services = items.filter((item) => item.active);
        const categories = new Set(this.services.map((item) => item.category));
        this.categories = ['Todas', ...Array.from(categories)];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    if (this.category === 'Todas') {
      this.filtered = this.services;
      return;
    }
    this.filtered = this.services.filter((item) => item.category === this.category);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  openDetails(service: Service): void {
    this.detailService = service;
  }

  closeDetails(): void {
    this.detailService = undefined;
  }

  reserve(service: Service): void {
    this.closeDetails();
    if (this.auth.currentUser) {
      this.router.navigate(['/book'], { queryParams: { service: service.id } });
      return;
    }
    this.router.navigate(['/login']);
  }

  describe(service: Service): string {
    const byCategory: Record<string, string> = {
      masajes: 'Terapia orientada a liberar tensión muscular y reducir el estrés.',
      manicure: 'Cuidado estético de manos con enfoque en limpieza, forma y acabado.',
      pedicure: 'Tratamiento integral para pies, hidratación profunda y relajación.',
      facial: 'Rutina de limpieza e hidratación para mejorar textura y luminosidad.',
      corporal: 'Experiencia para renovar energía, aliviar fatiga y mejorar bienestar.',
    };
    const categoryKey = (service.category || '').trim().toLowerCase();
    return (
      byCategory[categoryKey] ||
      `Servicio de ${service.category.toLowerCase()} de ${service.duration} minutos con atención profesional personalizada.`
    );
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.detailService) {
      this.closeDetails();
    }
  }
}


