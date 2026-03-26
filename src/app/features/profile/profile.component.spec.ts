import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AppointmentsService } from '../../core/appointments.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { UsersService } from '../../core/users.service';

describe('ProfileComponent', () => {
  let updateMeCalls = 0;
  let changePasswordCalls = 0;
  const toastCalls: Array<[string, string]> = [];

  const authMock = {
    currentUser: {
      id: 7,
      name: 'Cliente Demo',
      email: 'cliente@email.com',
      role: 'client' as const,
      phone: '3001234567',
      emailVerified: true,
    },
    syncCurrentUser: () => {},
  };

  const appointmentsMock = {
    listMine: () =>
      of([
        { id: 1, status: 'pending_payment', history: [] },
        { id: 2, status: 'pending_payment', history: [] },
        { id: 3, status: 'completed', history: [] },
        { id: 4, status: 'cancelled', history: [] },
      ]),
  };

  const usersMock = {
    updateMe: () => {
      updateMeCalls += 1;
      return of(authMock.currentUser);
    },
    changePassword: () => {
      changePasswordCalls += 1;
      return of(authMock.currentUser);
    },
  };

  const toastMock = {
    show: (message: string, type: string) => {
      toastCalls.push([message, type]);
    },
  };

  beforeEach(async () => {
    updateMeCalls = 0;
    changePasswordCalls = 0;
    toastCalls.length = 0;
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: UsersService, useValue: usersMock },
        { provide: AppointmentsService, useValue: appointmentsMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();
  });

  it('should count pending payment appointments separately', async () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component.totalAppointments).toBe(4);
    expect(component.pendingPaymentAppointments).toBe(2);
    expect(component.cancelledAppointments).toBe(1);
    expect(component.completedAppointments).toBe(1);

    const text = (fixture.nativeElement as HTMLElement).textContent || '';
    expect(text).toContain('Pendientes de pago');
    expect(text).toContain('Canceladas');
    expect(text).toContain('2');
  });

  it('should block client profile save when phone is not 10 digits', async () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.phone = '30012';
    component.saveProfile();

    expect(component.phoneValid).toBe(false);
    expect(updateMeCalls).toBe(0);
    expect(toastCalls.some(([message, type]) => message === 'Ingresa un telefono colombiano valido de 10 digitos.' && type === 'error')).toBe(true);
  });

  it('should block password change when the new password is weak', async () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.currentPassword = 'Actual123*';
    component.newPassword = 'abc123';
    component.confirmPassword = 'abc123';
    component.changePassword();

    expect(component.newPasswordSecurityValid).toBe(false);
    expect(changePasswordCalls).toBe(0);
    expect(
      toastCalls.some(
        ([message, type]) =>
          message === 'La nueva contrasena debe tener minimo 8 caracteres, mayuscula, minuscula, numero y caracter especial.' &&
          type === 'error',
      ),
    ).toBe(true);
  });
});
