import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { LoginPage } from './login.page';
import { SessionService } from '@auth/services/session.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  let sessionMock: jasmine.SpyObj<SessionService>;

  beforeEach(async () => {
    sessionMock = jasmine.createSpyObj('SessionService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: sessionMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('no debería ejecutar login si el formulario es inválido', async () => {
    await component.onSubmit();

    expect(sessionMock.login).not.toHaveBeenCalled();
    expect(component.submitAttempted()).toBeTrue();
    expect(component.identifierErrorMessage).toBeTruthy();
  });

  it('debería ejecutar login si el formulario es válido', fakeAsync(() => {
    sessionMock.login.and.returnValue(of(void 0));

    component.form.setValue({
      identifier: 'mati',
      password: '1234',
    });

    component.onSubmit();
    flushMicrotasks();

    expect(sessionMock.login).toHaveBeenCalledWith({
      identifier: 'mati',
      password: '1234',
    });
    expect(component.authError()).toBeNull();
  }));

  it('debería mostrar error de autenticación si falla', fakeAsync(() => {
    sessionMock.login.and.returnValue(throwError(() => new Error('error')));

    component.form.setValue({
      identifier: 'test@test.com',
      password: '1234',
    });

    component.onSubmit();

    flushMicrotasks();

    expect(sessionMock.login).toHaveBeenCalled();
    expect(component.authError()).toContain('No pudimos iniciar sesion');
  }));

  it('debería mapear USER_DISABLED desde error.code', fakeAsync(() => {
    sessionMock.login.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { code: 'USER_DISABLED' },
          }),
      ),
    );

    component.form.setValue({
      identifier: 'test@test.com',
      password: '1234',
    });

    component.onSubmit();
    flushMicrotasks();

    expect(component.authError()).toBe(
      'Tu usuario se encuentra deshabilitado. Contacta a un administrador.',
    );
  }));

  it('debería alternar visibilidad de contraseña', () => {
    expect(component.passwordVisible()).toBeFalse();

    component.togglePasswordVisibility();
    expect(component.passwordVisible()).toBeTrue();

    component.togglePasswordVisibility();
    expect(component.passwordVisible()).toBeFalse();
  });
});
