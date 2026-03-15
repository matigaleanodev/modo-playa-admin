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
import { AccountActivationSetPasswordPage } from './account-activation-set-password.page';
import { AccountActivationService } from '@auth/services/account-activation.service';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';

describe('AccountActivationSetPasswordPage', () => {
  let component: AccountActivationSetPasswordPage;
  let fixture: ComponentFixture<AccountActivationSetPasswordPage>;
  let activationMock: jasmine.SpyObj<AccountActivationService> & {
    identifier: WritableSignal<string | null>;
  };
  let navMock: jasmine.SpyObj<NavService>;
  let toastrMock: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    activationMock = Object.assign(
      jasmine.createSpyObj<AccountActivationService>('AccountActivationService', [
        'hydrate',
        'canSetPassword',
        'setPassword',
        'clearFlow',
      ]),
      { identifier: signal<string | null>('user@mail.com') },
    );

    navMock = jasmine.createSpyObj<NavService>('NavService', ['root']);
    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', ['success']);

    activationMock.hydrate.and.resolveTo();
    activationMock.canSetPassword.and.returnValue(true);
    activationMock.clearFlow.and.resolveTo();
    activationMock.setPassword.and.returnValue(of(void 0));
    toastrMock.success.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [AccountActivationSetPasswordPage],
      providers: [
        provideRouter([]),
        { provide: AccountActivationService, useValue: activationMock },
        { provide: NavService, useValue: navMock },
        { provide: ToastrService, useValue: toastrMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountActivationSetPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería redirigir al inicio si no hay token temporal', async () => {
    activationMock.canSetPassword.and.returnValue(false);

    await component.ngOnInit();

    expect(navMock.root).toHaveBeenCalledWith('/auth/activate');
  });

  it('debería validar reglas y coincidencia de contraseña', () => {
    component.form.setValue({ password: 'abc', confirmPassword: 'xyz' });
    component.submitAttempted.set(true);

    expect(component.passwordErrorMessage).toBeTruthy();
    expect(component.confirmPasswordErrorMessage).toContain('no coinciden');
  });

  it('debería alternar visibilidad de contraseñas', () => {
    component.togglePasswordVisibility();
    component.toggleConfirmPasswordVisibility();

    expect(component.passwordVisible()).toBeTrue();
    expect(component.confirmPasswordVisible()).toBeTrue();
  });

  it('debería configurar contraseña y mostrar feedback del frontend', fakeAsync(() => {
    component.form.setValue({
      password: 'Abcd12',
      confirmPassword: 'Abcd12',
    });

    component.onSubmit();
    flushMicrotasks();

    expect(activationMock.setPassword).toHaveBeenCalledWith({ password: 'Abcd12' });
    expect(toastrMock.success).toHaveBeenCalledWith(
      'Cuenta activada correctamente. Ingreso completado.',
      'Activación completada',
    );
  }));

  it('debería mostrar error si falla setPassword', fakeAsync(() => {
    activationMock.setPassword.and.returnValue(throwError(() => new Error('fail')));
    component.form.setValue({
      password: 'Abcd12',
      confirmPassword: 'Abcd12',
    });

    component.onSubmit();
    flushMicrotasks();

    expect(component.setupError()).toContain('No pudimos configurar la contraseña');
    expect(toastrMock.success).not.toHaveBeenCalled();
  }));

  it('debería mapear PASSWORD_ALREADY_SET desde error.code', fakeAsync(() => {
    activationMock.setPassword.and.returnValue(
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

    expect(component.setupError()).toBe(
      'La contraseña ya fue configurada para esta cuenta.',
    );
  }));
});
