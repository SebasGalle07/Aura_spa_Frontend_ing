import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';

import { BookingComponent } from './booking.component';
import { AppointmentsService } from '../../core/appointments.service';
import { AuthService } from '../../core/auth.service';
import { ProfessionalsService } from '../../core/professionals.service';
import { ServicesService } from '../../core/services.service';
import { ToastService } from '../../core/toast.service';

describe('BookingComponent', () => {
  let createCalls = 0;
  const toastCalls: Array<[string, string]> = [];

  const servicesMock = {
    list: () => of([]),
  };

  const professionalsMock = {
    list: () => of([]),
  };

  const appointmentsMock = {
    availability: () => of([]),
    create: () => {
      createCalls += 1;
      return of({});
    },
    initPayment: () => of({}),
  };

  const authMock = {
    currentUser: {
      id: 7,
      name: 'Cliente Demo',
      email: 'cliente@email.com',
      role: 'client' as const,
      phone: '',
      emailVerified: true,
    },
  };

  const toastMock = {
    show: (message: string, type: string) => {
      toastCalls.push([message, type]);
    },
  };

  beforeEach(async () => {
    createCalls = 0;
    toastCalls.length = 0;

    await TestBed.configureTestingModule({
      imports: [BookingComponent],
      providers: [
        provideRouter([]),
        { provide: ServicesService, useValue: servicesMock },
        { provide: ProfessionalsService, useValue: professionalsMock },
        { provide: AppointmentsService, useValue: appointmentsMock },
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastMock },
        { provide: Location, useValue: { back: () => {} } },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } },
      ],
    }).compileComponents();
  });

  it('should block booking creation when client phone is not 10 digits', async () => {
    const fixture = TestBed.createComponent(BookingComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.selectedService = { id: 1, name: 'Masaje', category: 'Masajes', duration: 60, price: 100000, active: true };
    component.selectedProfessional = {
      id: 2,
      name: 'Profesional Demo',
      specialty: 'Masajes',
      scheduleStart: '08:00',
      scheduleEnd: '18:00',
      active: true,
    };
    component.date = '2026-03-30';
    component.selectedTime = '10:00';
    component.clientPhone = '30012';

    component.confirmBooking();

    expect(component.clientPhoneValid).toBe(false);
    expect(createCalls).toBe(0);
    expect(
      toastCalls.some(
        ([message, type]) => message === 'Ingresa un telefono colombiano valido de 10 digitos para continuar.' && type === 'error',
      ),
    ).toBe(true);
  });
});
