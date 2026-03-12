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
import { AccountActivationVerifyPage } from './account-activation-verify.page';
import { AccountActivationService } from '@auth/services/account-activation.service';
import { NavService } from '@shared/services/nav/nav.service';

describe('AccountActivationVerifyPage', () => {
  let component: AccountActivationVerifyPage;
  let fixture: ComponentFixture<AccountActivationVerifyPage>;
  let activationMock: jasmine.SpyObj<AccountActivationService> & {
    identifier: WritableSignal<string | null>;
  };
  let navMock: jasmine.SpyObj<NavService>;

  beforeEach(async () => {
    activationMock = Object.assign(
      jasmine.createSpyObj<AccountActivationService>('AccountActivationService', [
        'hydrate',
        'canVerifyCode',
        'verifyCode',
        'clearFlow',
      ]),
      { identifier: signal<string | null>('user@mail.com') },
    );

    navMock = jasmine.createSpyObj<NavService>('NavService', ['forward', 'root']);

    activationMock.hydrate.and.resolveTo();
    activationMock.canVerifyCode.and.returnValue(true);
    activationMock.clearFlow.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [AccountActivationVerifyPage],
      providers: [
        provideRouter([]),
        { provide: AccountActivationService, useValue: activationMock },
        { provide: NavService, useValue: navMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountActivationVerifyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería redirigir si no hay identifier', async () => {
    activationMock.canVerifyCode.and.returnValue(false);

    await component.ngOnInit();

    expect(navMock.root).toHaveBeenCalledWith('/auth/activate');
  });

  it('no debería validar si el formulario es inválido', async () => {
    await component.onSubmit();

    expect(activationMock.verifyCode).not.toHaveBeenCalled();
    expect(component.codeErrorMessage).toBeTruthy();
  });

  it('debería validar código y navegar a set-password', fakeAsync(() => {
    activationMock.verifyCode.and.returnValue(of(void 0));
    component.form.setValue({ code: '123456' });

    component.onSubmit();
    flushMicrotasks();

    expect(activationMock.verifyCode).toHaveBeenCalledWith({ code: '123456' });
    expect(navMock.forward).toHaveBeenCalledWith('/auth/activate/set-password');
  }));

  it('debería mostrar error si falla la validación', fakeAsync(() => {
    activationMock.verifyCode.and.returnValue(throwError(() => new Error('bad')));
    component.form.setValue({ code: '123456' });

    component.onSubmit();
    flushMicrotasks();

    expect(component.verifyError()).toContain('No pudimos validar el código');
  }));

  it('debería usar INVALID_CREDENTIALS desde error.code', fakeAsync(() => {
    activationMock.verifyCode.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { code: 'INVALID_CREDENTIALS' },
          }),
      ),
    );
    component.form.setValue({ code: '123456' });

    component.onSubmit();
    flushMicrotasks();

    expect(component.verifyError()).toBe('Credenciales inválidas.');
  }));
});
