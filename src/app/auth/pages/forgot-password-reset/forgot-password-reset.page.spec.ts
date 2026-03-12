import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPasswordResetPage } from './forgot-password-reset.page';
import { PasswordRecoveryService } from '@auth/services/password-recovery.service';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';

describe('ForgotPasswordResetPage', () => {
  let component: ForgotPasswordResetPage;
  let fixture: ComponentFixture<ForgotPasswordResetPage>;

  let recoveryMock: jasmine.SpyObj<PasswordRecoveryService> & {
    identifier: WritableSignal<string | null>;
  };
  let navMock: jasmine.SpyObj<NavService>;
  let toastrMock: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    recoveryMock = Object.assign(
      jasmine.createSpyObj<PasswordRecoveryService>('PasswordRecoveryService', [
        'hydrate',
        'canResetPassword',
        'resetPassword',
        'clearFlow',
      ]),
      {
        identifier: signal<string | null>('user@mail.com'),
      },
    );

    navMock = jasmine.createSpyObj<NavService>('NavService', ['root']);
    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', ['success']);

    recoveryMock.hydrate.and.resolveTo();
    recoveryMock.canResetPassword.and.returnValue(true);
    recoveryMock.clearFlow.and.resolveTo();
    toastrMock.success.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordResetPage],
      providers: [
        provideRouter([]),
        { provide: PasswordRecoveryService, useValue: recoveryMock },
        { provide: NavService, useValue: navMock },
        { provide: ToastrService, useValue: toastrMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordResetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería redirigir al inicio si no existe token temporal', async () => {
    recoveryMock.canResetPassword.and.returnValue(false);

    await component.ngOnInit();

    expect(navMock.root).toHaveBeenCalledWith('/auth/forgot-password');
  });

  it('debería validar reglas de contraseña y coincidencia', () => {
    component.form.setValue({
      password: 'abc',
      confirmPassword: 'xyz',
    });
    component.submitAttempted.set(true);

    expect(component.passwordErrorMessage).toBeTruthy();
    expect(component.confirmPasswordErrorMessage).toContain('no coinciden');
  });

  it('debería alternar visibilidad de password y confirmPassword', () => {
    expect(component.passwordVisible()).toBeFalse();
    expect(component.confirmPasswordVisible()).toBeFalse();

    component.togglePasswordVisibility();
    component.toggleConfirmPasswordVisibility();

    expect(component.passwordVisible()).toBeTrue();
    expect(component.confirmPasswordVisible()).toBeTrue();
  });

  it('debería resetear contraseña y mostrar mensaje del frontend', fakeAsync(() => {
    recoveryMock.resetPassword.and.returnValue(of({ message: 'backend dev message' }));

    component.form.setValue({
      password: 'Abcd12',
      confirmPassword: 'Abcd12',
    });

    component.onSubmit();
    flushMicrotasks();

    expect(recoveryMock.resetPassword).toHaveBeenCalledWith({ password: 'Abcd12' });
    expect(toastrMock.success).toHaveBeenCalledWith(
      'Contraseña actualizada correctamente. Inicia sesión para continuar.',
      'Recuperación completada',
    );
    expect(navMock.root).toHaveBeenCalledWith('/auth/login');
  }));

  it('debería mostrar error si falla resetPassword', fakeAsync(() => {
    recoveryMock.resetPassword.and.returnValue(throwError(() => new Error('fail')));
    component.form.setValue({
      password: 'Abcd12',
      confirmPassword: 'Abcd12',
    });

    component.onSubmit();
    flushMicrotasks();

    expect(component.resetError()).toContain('No pudimos actualizar la contraseña');
    expect(toastrMock.success).not.toHaveBeenCalled();
    expect(navMock.root).not.toHaveBeenCalledWith('/auth/login');
  }));

  it('debería mapear PASSWORD_ALREADY_SET desde error.code', fakeAsync(() => {
    recoveryMock.resetPassword.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { code: 'PASSWORD_ALREADY_SET' },
          }),
      ),
    );
    component.form.setValue({
      password: 'Abcd12',
      confirmPassword: 'Abcd12',
    });

    component.onSubmit();
    flushMicrotasks();

    expect(component.resetError()).toBe(
      'La contraseña ya fue configurada para esta cuenta.',
    );
  }));

  it('restartFlow debería limpiar flujo y navegar al inicio', fakeAsync(() => {
    component.restartFlow();
    flushMicrotasks();

    expect(recoveryMock.clearFlow).toHaveBeenCalled();
    expect(navMock.root).toHaveBeenCalledWith('/auth/forgot-password');
  }));
});
