import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { routes } from '../../app.routes';
import { AuthService } from '../../core/auth.service';
import { CompanyService } from '../../core/company.service';
import { ServicesService } from '../../core/services.service';
import { ServicesComponent } from '../services/services.component';

describe('HomeComponent', () => {
  const servicesMock = {
    list: () => of([]),
  };

  const companyMock = {
    branding$: of(null),
  };

  const authMock = {
    currentUser: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter(routes),
        { provide: ServicesService, useValue: servicesMock },
        { provide: CompanyService, useValue: companyMock },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();
  });

  it('should send "Ver todos" to /services', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const links = fixture.debugElement.queryAll(By.directive(RouterLink));
    const target = links.find((link) => link.nativeElement.textContent?.includes('Ver todos'));

    expect(target).toBeTruthy();
    expect(target?.injector.get(RouterLink).href).toBe('/services');
  });

  it('should keep the public services route mapped to ServicesComponent', () => {
    const servicesRoute = routes.find((route) => route.path === 'services');

    expect(servicesRoute).toBeTruthy();
    expect(servicesRoute?.component).toBe(ServicesComponent);
  });
});
