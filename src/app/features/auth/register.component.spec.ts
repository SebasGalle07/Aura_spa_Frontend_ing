import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

describe('RegisterComponent', () => {
  const authMock = {
    register: () => of({ ok: true, emailVerificationRequired: true }),
    loginWithGoogle: () => throwError(() => new Error('not used')),
  };
  const toastMock = {
    show: () => {},
  };
  const draftKey = 'aura_spa_register_draft_v1';

  beforeEach(async () => {
    sessionStorage.removeItem(draftKey);
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();
  });

  it('should restore the saved draft when reopened', async () => {
    sessionStorage.setItem(
      draftKey,
      JSON.stringify({
        name: 'Sebastian Gallego',
        email: 'sebastian@email.com',
        phone: '3001234567',
        password: 'Abcd1234*',
        confirmPassword: 'Abcd1234*',
        acceptTerms: true,
      }),
    );

    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component.name).toBe('Sebastian Gallego');
    expect(component.email).toBe('sebastian@email.com');
    expect(component.phone).toBe('3001234567');
    expect(component.password).toBe('Abcd1234*');
    expect(component.confirmPassword).toBe('Abcd1234*');
    expect(component.acceptTerms).toBe(true);
  });

  it('should clear the draft after successful registration', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.name = 'Sebastian Gallego';
    component.email = 'sebastian@email.com';
    component.phone = '3001234567';
    component.password = 'Abcd1234*';
    component.confirmPassword = 'Abcd1234*';
    component.acceptTerms = true;
    component.onDraftChanged();

    expect(sessionStorage.getItem(draftKey)).toBeTruthy();

    component.submit();

    expect(sessionStorage.getItem(draftKey)).toBeNull();
  });

  it('should require a 10-digit phone to submit', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.name = 'Sebastian Gallego';
    component.email = 'sebastian@email.com';
    component.phone = '30012345';
    component.password = 'Abcd1234*';
    component.confirmPassword = 'Abcd1234*';
    component.acceptTerms = true;

    expect(component.phoneValid).toBe(false);
    expect(component.canSubmit).toBe(false);
  });
});
