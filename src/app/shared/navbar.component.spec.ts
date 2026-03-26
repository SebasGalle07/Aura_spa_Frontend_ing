import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { NavbarComponent } from './navbar.component';
import { AuthService } from '../core/auth.service';
import { CompanyService } from '../core/company.service';
import { User } from '../core/models';

describe('NavbarComponent', () => {
  const user$ = new BehaviorSubject<User | null>(null);
  const authMock = {
    user$,
    logout: () => {},
  };
  const companyMock = {
    branding$: of(null),
  };

  beforeEach(async () => {
    user$.next(null);
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: CompanyService, useValue: companyMock },
      ],
    }).compileComponents();
  });

  it('should show the public menu for guests', async () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent || '';
    expect(text).toContain('Inicio');
    expect(text).toContain('Acerca de');
    expect(text).toContain('Contacto');
    expect(text).not.toContain('Mis citas');
  });

  it('should hide the public menu for authenticated users', async () => {
    user$.next({
      id: 7,
      name: 'Cliente Demo',
      email: 'cliente@email.com',
      role: 'client',
      phone: '3001234567',
      createdAt: '',
      emailVerified: true,
    });

    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent || '';
    expect(text).not.toContain('Inicio');
    expect(text).not.toContain('Acerca de');
    expect(text).not.toContain('Contacto');
    expect(text).toContain('Reservar');
    expect(text).toContain('Mis citas');
    expect(text).toContain('Perfil');
  });

  it('should not show booking links to admins', async () => {
    user$.next({
      id: 1,
      name: 'Admin Demo',
      email: 'admin@email.com',
      role: 'admin',
      phone: '3001112233',
      createdAt: '',
      emailVerified: true,
    });

    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent || '';
    expect(text).not.toContain('Reservar');
    expect(text).not.toContain('Mis citas');
    expect(text).toContain('Perfil');
    expect(text).toContain('Admin');
  });
});
