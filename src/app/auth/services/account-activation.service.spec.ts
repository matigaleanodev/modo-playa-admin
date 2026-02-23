import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AccountActivationService } from './account-activation.service';
import { AuthService } from './auth.service';
import { StorageService } from '@shared/services/storage/storage.service';
import { SessionService } from './session.service';

describe('AccountActivationService', () => {
  let service: AccountActivationService;
  let authMock: jasmine.SpyObj<AuthService>;
  let storageMock: jasmine.SpyObj<StorageService>;
  let sessionMock: jasmine.SpyObj<SessionService>;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'requestActivation',
      'activate',
      'setPasswordWithToken',
    ]);

    storageMock = jasmine.createSpyObj<StorageService>('StorageService', [
      'getItem',
      'setItem',
      'removeItem',
    ]);

    sessionMock = jasmine.createSpyObj<SessionService>('SessionService', [
      'startAuthenticatedSession',
    ]);

    storageMock.getItem.and.resolveTo(null);
    storageMock.setItem.and.resolveTo();
    storageMock.removeItem.and.resolveTo();
    sessionMock.startAuthenticatedSession.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        AccountActivationService,
        { provide: AuthService, useValue: authMock },
        { provide: StorageService, useValue: storageMock },
        { provide: SessionService, useValue: sessionMock },
      ],
    });

    service = TestBed.inject(AccountActivationService);
    await service.hydrate();
  });

  it('requestCode debería normalizar identifier y persistir flujo', async () => {
    authMock.requestActivation.and.returnValue(of({ message: 'ok' }));

    const result = await new Promise<{ message: string }>((resolve, reject) =>
      service.requestCode({ identifier: ' USER@MAIL.COM ' }).subscribe({
        next: resolve,
        error: reject,
      }),
    );

    expect(authMock.requestActivation).toHaveBeenCalledWith({
      identifier: 'user@mail.com',
    });
    expect(service.identifier()).toBe('user@mail.com');
    expect(service.setupToken()).toBeNull();
    expect(storageMock.setItem).toHaveBeenCalledWith(
      'account_activation_identifier',
      'user@mail.com',
    );
    expect(result).toEqual({ message: 'ok' });
  });

  it('verifyCode debería fallar si no hay identifier', () => {
    expect(() => service.verifyCode({ code: '123456' })).toThrowError(
      'No hay identificador para activar la cuenta.',
    );
  });

  it('verifyCode debería guardar token temporal', async () => {
    authMock.requestActivation.and.returnValue(of({ message: 'ok' }));
    authMock.activate.and.returnValue(of({ accessToken: 'setup-token' }));

    await new Promise<void>((resolve, reject) =>
      service.requestCode({ identifier: 'user' }).subscribe({
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

    expect(authMock.activate).toHaveBeenCalledWith({
      identifier: 'user',
      code: '123456',
    });
    expect(service.setupToken()).toBe('setup-token');
    expect(service.canSetPassword()).toBeTrue();
  });

  it('setPassword debería fallar si no hay token temporal', () => {
    expect(() => service.setPassword({ password: 'Abcd12' })).toThrowError(
      'No hay token temporal para configurar la contraseña.',
    );
  });

  it('setPassword debería autenticar sesión y limpiar flujo', async () => {
    authMock.requestActivation.and.returnValue(of({ message: 'ok' }));
    authMock.activate.and.returnValue(of({ accessToken: 'setup-token' }));
    authMock.setPasswordWithToken.and.returnValue(
      of({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: '1',
          email: 'u@test.com',
          username: 'user',
          role: 'OWNER',
        },
      } as any),
    );

    await new Promise<void>((resolve, reject) =>
      service.requestCode({ identifier: 'user' }).subscribe({
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
    await new Promise<void>((resolve, reject) =>
      service.setPassword({ password: 'Abcd12' }).subscribe({
        next: () => resolve(),
        error: reject,
      }),
    );

    expect(authMock.setPasswordWithToken).toHaveBeenCalledWith(
      { password: 'Abcd12' },
      'setup-token',
    );
    expect(sessionMock.startAuthenticatedSession).toHaveBeenCalled();
    expect(service.identifier()).toBeNull();
    expect(service.setupToken()).toBeNull();
  });
});
