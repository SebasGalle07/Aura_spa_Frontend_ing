import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ServicesService } from '../../core/services.service';
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

  constructor(private servicesApi: ServicesService) {}

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
}


