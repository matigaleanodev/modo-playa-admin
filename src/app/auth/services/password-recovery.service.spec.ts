import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PasswordRecoveryService } from './password-recovery.service';
import { AuthService } from './auth.service';
import { StorageService } from '@shared/services/storage/storage.service';

describe('PasswordRecoveryService', () => {
  let service: PasswordRecoveryService;
  let authMock: jasmine.SpyObj<AuthService>;
  let storageMock: jasmine.SpyObj<StorageService>;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'forgotPassword',
      'verifyRequestCode',
      'resetPassword',
    ]);

    storageMock = jasmine.createSpyObj<StorageService>('StorageService', [
      'getItem',
      'setItem',
      'removeItem',
    ]);

    storageMock.getItem.and.resolveTo(null);
    storageMock.setItem.and.resolveTo();
    storageMock.removeItem.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        PasswordRecoveryService,
        { provide: AuthService, useValue: authMock },
        { provide: StorageService, useValue: storageMock },
      ],
    });

    service = TestBed.inject(PasswordRecoveryService);

    // El servicio hidrata en constructor; esperamos a que termine para evitar
    // condiciones de carrera en los tests que actualizan spies de storage.
    await service.hydrate();
  });

  it('debería hidratar estado desde storage', async () => {
    storageMock.getItem.withArgs('password_recovery_identifier').and.resolveTo('u@test.com');
    storageMock.getItem.withArgs('password_recovery_reset_token').and.resolveTo('tmp');

    await service.hydrate();

    expect(service.identifier()).toBe('u@test.com');
    expect(service.resetToken()).toBe('tmp');
  });

  it('requestCode debería normalizar identifier, persistirlo y limpiar token temporal', (done) => {
    authMock.forgotPassword.and.returnValue(of({ message: 'dev message' }));

    service.requestCode({ identifier: ' USER@MAIL.COM ' }).subscribe({
      next: (response) => {
        expect(authMock.forgotPassword).toHaveBeenCalledWith({
          identifier: 'user@mail.com',
        });
        expect(storageMock.setItem).toHaveBeenCalledWith(
          'password_recovery_identifier',
          'user@mail.com',
        );
        expect(storageMock.removeItem).toHaveBeenCalledWith(
          'password_recovery_reset_token',
        );
        expect(service.identifier()).toBe('user@mail.com');
        expect(service.resetToken()).toBeNull();
        expect(response).toEqual({ message: 'dev message' });
        done();
      },
      error: done.fail,
    });
  });

  it('verifyCode debería fallar si no hay identifier', () => {
    expect(() => service.verifyCode({ code: '123456' })).toThrowError(
      'No hay identificador para validar el código.',
    );
  });

  it('verifyCode debería guardar token temporal', async () => {
    authMock.forgotPassword.and.returnValue(of({ message: 'ok' }));
    await new Promise<void>((resolve, reject) => {
      service.requestCode({ identifier: 'user' }).subscribe({
        next: () => resolve(),
        error: reject,
      });
    });

    authMock.verifyRequestCode.and.returnValue(of({ accessToken: 'temp-token' }));

    await new Promise<void>((resolve, reject) => {
      service.verifyCode({ code: '123456' }).subscribe({
        next: () => resolve(),
        error: reject,
      });
    });

    expect(authMock.verifyRequestCode).toHaveBeenCalledWith({
      identifier: 'user',
      code: '123456',
    });
    expect(storageMock.setItem).toHaveBeenCalledWith(
      'password_recovery_reset_token',
      'temp-token',
    );
    expect(service.resetToken()).toBe('temp-token');
    expect(service.canResetPassword()).toBeTrue();
  });

  it('resetPassword debería fallar si no hay token temporal', () => {
    expect(() => service.resetPassword({ password: 'Abcd12' })).toThrowError(
      'No hay token temporal para resetear la contraseña.',
    );
  });

  it('resetPassword debería usar token temporal y limpiar flujo al finalizar', async () => {
    authMock.forgotPassword.and.returnValue(of({ message: 'ok' }));
    authMock.verifyRequestCode.and.returnValue(of({ accessToken: 'temp-token' }));
    authMock.resetPassword.and.returnValue(of({ message: 'dev msg' }));

    await new Promise<void>((resolve, reject) =>
      service.requestCode({ identifier: 'user@mail.com' }).subscribe({
        next: () => resolve(),
        error: reject,
      }),
    );
    await new Promise<void>((resolve, reject) =>
      service.verifyCode({ code: '123456' }).subscribe({
        next: () => resolve(),
        error: reject,
      }),
    );

    const result = await new Promise<{ message: string }>((resolve, reject) =>
      service.resetPassword({ password: 'Abcd12' }).subscribe({
        next: resolve,
        error: reject,
      }),
    );

    expect(authMock.resetPassword).toHaveBeenCalledWith(
      { password: 'Abcd12' },
      'temp-token',
    );
    expect(result).toEqual({ message: 'dev msg' });
    expect(service.identifier()).toBeNull();
    expect(service.resetToken()).toBeNull();
    expect(storageMock.removeItem).toHaveBeenCalledWith('password_recovery_identifier');
    expect(storageMock.removeItem).toHaveBeenCalledWith('password_recovery_reset_token');
  });

  it('debería propagar errores de verifyCode', (done) => {
    authMock.forgotPassword.and.returnValue(of({ message: 'ok' }));

    service.requestCode({ identifier: 'user' }).subscribe({
      next: () => {
        authMock.verifyRequestCode.and.returnValue(
          throwError(() => new Error('invalid')),
        );

        service.verifyCode({ code: '123456' }).subscribe({
          next: () => done.fail('se esperaba error'),
          error: (error) => {
            expect(error).toEqual(jasmine.any(Error));
            done();
          },
        });
      },
      error: done.fail,
    });
  });
});
