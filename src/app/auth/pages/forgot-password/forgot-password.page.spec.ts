import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPasswordPage } from './forgot-password.page';
import { PasswordRecoveryService } from '@auth/services/password-recovery.service';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NavService } from '@shared/services/nav/nav.service';

describe('ForgotPasswordPage', () => {
  let component: ForgotPasswordPage;
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let recoveryMock: jasmine.SpyObj<PasswordRecoveryService>;
  let loadingMock: jasmine.SpyObj<LoadingService>;
  let navMock: jasmine.SpyObj<NavService>;
  let dismissMock: jasmine.Spy;

  beforeEach(async () => {
    recoveryMock = jasmine.createSpyObj<PasswordRecoveryService>('PasswordRecoveryService', [
      'requestCode',
    ]);
    loadingMock = jasmine.createSpyObj<LoadingService>('LoadingService', ['show']);
    navMock = jasmine.createSpyObj<NavService>('NavService', ['forward']);
    dismissMock = jasmine.createSpy('dismiss').and.resolveTo();

    loadingMock.show.and.resolveTo(dismissMock);

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [
        provideRouter([]),
        { provide: PasswordRecoveryService, useValue: recoveryMock },
        { provide: LoadingService, useValue: loadingMock },
        { provide: NavService, useValue: navMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('no debería enviar solicitud si el formulario es inválido', async () => {
    await component.onSubmit();

    expect(recoveryMock.requestCode).not.toHaveBeenCalled();
    expect(component.submitAttempted()).toBeTrue();
    expect(component.identifierErrorMessage).toBeTruthy();
  });

  it('debería enviar solicitud y mostrar feedback genérico del frontend', fakeAsync(() => {
    recoveryMock.requestCode.and.returnValue(
      of({ message: 'mensaje del backend para dev' }),
    );

    component.form.setValue({ identifier: 'TEST@MAIL.COM' });

    component.onSubmit();
    flushMicrotasks();

    expect(loadingMock.show).toHaveBeenCalledWith('Enviando instrucciones...');
    expect(recoveryMock.requestCode).toHaveBeenCalledWith({
      identifier: 'TEST@MAIL.COM',
    });
    expect(component.successMessage()).toBe(
      'Si el usuario existe, enviamos un código de verificación al email registrado.',
    );
    expect(navMock.forward).toHaveBeenCalledWith('/auth/forgot-password/verify');
    expect(dismissMock).toHaveBeenCalled();
  }));

  it('debería mostrar error si falla la solicitud', fakeAsync(() => {
    recoveryMock.requestCode.and.returnValue(
      throwError(() => new Error('network')),
    );

    component.form.setValue({ identifier: 'user' });

    component.onSubmit();
    flushMicrotasks();

    expect(component.requestError()).toContain('No pudimos procesar la solicitud');
    expect(navMock.forward).not.toHaveBeenCalled();
    expect(dismissMock).toHaveBeenCalled();
  }));
});
