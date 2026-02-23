import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPasswordVerifyPage } from './forgot-password-verify.page';
import { PasswordRecoveryService } from '@auth/services/password-recovery.service';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NavService } from '@shared/services/nav/nav.service';

describe('ForgotPasswordVerifyPage', () => {
  let component: ForgotPasswordVerifyPage;
  let fixture: ComponentFixture<ForgotPasswordVerifyPage>;

  let recoveryMock: jasmine.SpyObj<PasswordRecoveryService> & {
    identifier: WritableSignal<string | null>;
  };
  let loadingMock: jasmine.SpyObj<LoadingService>;
  let navMock: jasmine.SpyObj<NavService>;
  let dismissMock: jasmine.Spy;

  beforeEach(async () => {
    recoveryMock = Object.assign(
      jasmine.createSpyObj<PasswordRecoveryService>('PasswordRecoveryService', [
        'hydrate',
        'canVerifyCode',
        'verifyCode',
        'clearFlow',
      ]),
      {
        identifier: signal<string | null>('user@mail.com'),
      },
    );

    loadingMock = jasmine.createSpyObj<LoadingService>('LoadingService', ['show']);
    navMock = jasmine.createSpyObj<NavService>('NavService', ['forward', 'root']);
    dismissMock = jasmine.createSpy('dismiss').and.resolveTo();

    recoveryMock.hydrate.and.resolveTo();
    recoveryMock.canVerifyCode.and.returnValue(true);
    recoveryMock.clearFlow.and.resolveTo();
    loadingMock.show.and.resolveTo(dismissMock);

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordVerifyPage],
      providers: [
        provideRouter([]),
        { provide: PasswordRecoveryService, useValue: recoveryMock },
        { provide: LoadingService, useValue: loadingMock },
        { provide: NavService, useValue: navMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordVerifyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería redirigir al inicio del flujo si no hay identifier', async () => {
    recoveryMock.canVerifyCode.and.returnValue(false);

    await component.ngOnInit();

    expect(navMock.root).toHaveBeenCalledWith('/auth/forgot-password');
  });

  it('no debería validar código si el formulario es inválido', async () => {
    await component.onSubmit();

    expect(recoveryMock.verifyCode).not.toHaveBeenCalled();
    expect(component.codeErrorMessage).toBeTruthy();
  });

  it('debería validar código y navegar al paso reset', fakeAsync(() => {
    recoveryMock.verifyCode.and.returnValue(of(void 0));
    component.form.setValue({ code: '123456' });

    component.onSubmit();
    flushMicrotasks();

    expect(loadingMock.show).toHaveBeenCalledWith('Validando código...');
    expect(recoveryMock.verifyCode).toHaveBeenCalledWith({ code: '123456' });
    expect(navMock.forward).toHaveBeenCalledWith('/auth/forgot-password/reset');
    expect(dismissMock).toHaveBeenCalled();
  }));

  it('debería mostrar error si falla la validación del código', fakeAsync(() => {
    recoveryMock.verifyCode.and.returnValue(throwError(() => new Error('bad code')));
    component.form.setValue({ code: '123456' });

    component.onSubmit();
    flushMicrotasks();

    expect(component.verifyError()).toContain('No pudimos validar el código');
    expect(navMock.forward).not.toHaveBeenCalled();
  }));

  it('restartFlow debería limpiar estado y volver al inicio', fakeAsync(() => {
    component.restartFlow();
    flushMicrotasks();

    expect(recoveryMock.clearFlow).toHaveBeenCalled();
    expect(navMock.root).toHaveBeenCalledWith('/auth/forgot-password');
  }));
});
