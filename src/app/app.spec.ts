import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { App } from './app';
import { AuthService } from './core/auth.service';
import { CompanyService } from './core/company.service';
import { IdleService } from './core/idle.service';
import { ToastService } from './core/toast.service';

describe('App', () => {
  const toast$ = new Subject<{ message: string; type: 'success' | 'error' | 'info' }>();
  const authMock = {
    user$: of(null),
    restoreSession: () => of(null),
  };
  const idleMock = {
    start: vi.fn(),
    stop: vi.fn(),
  };
  const companyMock = {
    branding$: of(null),
    loadPublic: () => of(null),
  };
  const toastMock = {
    toast$,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: IdleService, useValue: idleMock },
        { provide: CompanyService, useValue: companyMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the application shell', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main#main-content')).toBeTruthy();
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
  });
});
