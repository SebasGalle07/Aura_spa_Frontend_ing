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
  detailServiceInfo?: { description: string; highlights: string[] };

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
    this.detailServiceInfo = this.buildServiceInfo(service);
  }

  closeDetails(): void {
    this.detailService = undefined;
    this.detailServiceInfo = undefined;
  }

  reserve(service: Service): void {
    this.closeDetails();
    if (this.auth.currentUser) {
      this.router.navigate(['/book'], { queryParams: { service: service.id } });
      return;
    }
    this.router.navigate(['/login']);
  }

  private buildServiceInfo(service: Service): { description: string; highlights: string[] } {
    const byCategory: Record<string, { description: string; highlights: string[] }> = {
      masajes: {
        description:
          'Una experiencia de relajación profunda diseñada para liberar la tensión acumulada, mejorar la circulación y restaurar el equilibrio entre cuerpo y mente. Nuestras terapeutas especializadas adaptan cada sesión a tus necesidades, utilizando técnicas de masoterapia con aceites esenciales de alta calidad.',
        highlights: [
          'Alivia contracturas y dolor muscular',
          'Mejora la circulación sanguínea y linfática',
          'Reduce el estrés y la ansiedad',
          'Aceites esenciales de primera calidad incluidos',
          'Sesión personalizada según tus necesidades',
        ],
      },
      manicure: {
        description:
          'Dale a tus manos el cuidado que merecen. Combinamos limpieza profesional, hidratación intensiva y acabados duraderos para que tus uñas luzcan impecables. Utilizamos productos de marcas reconocidas que garantizan resultados que perduran en el tiempo.',
        highlights: [
          'Limpieza y exfoliación de manos',
          'Hidratación profunda con cremas de tratamiento',
          'Definición de cutículas y forma de uña',
          'Aplicación de esmalte de larga duración',
          'Acabado con brillo protector',
        ],
      },
      pedicure: {
        description:
          'Tus pies merecen un descanso real. Nuestro pedicure integral combina el alivio de la tensión acumulada con un cuidado estético completo, dejando tus pies suaves, saludables y perfectamente hidratados. Una experiencia de bienestar total que sentirás desde el primer minuto.',
        highlights: [
          'Baño de pies relajante con sales aromáticas',
          'Eliminación de callosidades y piel seca',
          'Hidratación profunda con masaje de piernas',
          'Forma y limpieza de uñas profesional',
          'Aplicación de esmalte incluida',
        ],
      },
      facial: {
        description:
          'Revela la mejor versión de tu piel con nuestra rutina facial especializada. Analizamos el tipo de piel de cada clienta para aplicar los productos y técnicas más adecuados, logrando una limpieza profunda, hidratación óptima y un brillo natural que se nota desde el primer tratamiento.',
        highlights: [
          'Análisis y diagnóstico del tipo de piel',
          'Limpieza profunda con vapor facial',
          'Extracción de impurezas profesional',
          'Mascarilla hidratante o purificante según tu piel',
          'Sérum y crema de acabado incluidos',
        ],
      },
      corporal: {
        description:
          'Una experiencia de bienestar total que va más allá de la superficie. Nuestros tratamientos corporales combinan exfoliación, envoltura e hidratación para renovar tu piel, eliminar toxinas y devolverle la vitalidad que merece. Sal de aquí completamente renovada, por dentro y por fuera.',
        highlights: [
          'Exfoliación corporal con ingredientes naturales',
          'Envoltura hidratante o reafirmante',
          'Aplicación de aceites y cremas nutritivas',
          'Mejora la textura y elasticidad de la piel',
          'Estimulación de la circulación y drenaje linfático',
        ],
      },
      depilacion: {
        description:
          'Olvídate del vello no deseado con nuestro servicio de depilación profesional. Aplicamos la técnica más adecuada para tu tipo de piel y área de tratamiento, garantizando resultados duraderos y un proceso lo más cómodo posible, con productos que cuidan e hidratan tu piel durante el tratamiento.',
        highlights: [
          'Técnica adaptada a tu tipo de piel',
          'Productos calmantes e hidratantes incluidos',
          'Personal altamente capacitado',
          'Resultados duraderos',
          'Ambiente de total privacidad y comodidad',
        ],
      },
    };

    const categoryKey = (service.category || '').trim().toLowerCase();
    return (
      byCategory[categoryKey] ?? {
        description: `Disfruta de una sesión de ${service.category.toLowerCase()} de ${service.duration} minutos con atención profesional completamente personalizada. Nuestro equipo está capacitado para brindarte la mejor experiencia de bienestar, adaptando cada detalle a tus preferencias y necesidades.`,
        highlights: [
          'Atención profesional personalizada',
          'Productos de alta calidad',
          `Sesión de ${service.duration} minutos`,
          'Ambiente tranquilo y relajante',
        ],
      }
    );
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.detailService) {
      this.closeDetails();
    }
  }
}


