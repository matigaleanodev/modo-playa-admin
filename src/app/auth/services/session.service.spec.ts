import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SessionService } from './session.service';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { NavService } from '@shared/services/nav/nav.service';
import { AuthUser } from '@auth/models/auth-user.model';

describe('SessionService', () => {
  let service: SessionService;

  let authMock: jasmine.SpyObj<AuthService>;
  let tokenMock: jasmine.SpyObj<TokenService>;
  let navMock: jasmine.SpyObj<NavService>;

  const fakeUser: AuthUser = {
    id: '1',
    email: 'test@test.com',
    username: 'test',
    role: 'OWNER',
  };

  beforeEach(() => {
    authMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'refresh',
      'me',
    ]);

    tokenMock = jasmine.createSpyObj<TokenService>('TokenService', [
      'getAccessToken',
      'setTokens',
      'clearTokens',
    ]);

    navMock = jasmine.createSpyObj<NavService>('NavService', ['root']);

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: AuthService, useValue: authMock },
        { provide: TokenService, useValue: tokenMock },
        { provide: NavService, useValue: navMock },
      ],
    });

    service = TestBed.inject(SessionService);
  });

  it('init sin token debería dejar user null', async () => {
    tokenMock.getAccessToken.and.resolveTo(null);

    await service.init();

    expect(service.user()).toBeNull();
  });

  it('init con token válido debería setear user', async () => {
    tokenMock.getAccessToken.and.resolveTo('token');
    authMock.me.and.returnValue(of(fakeUser));

    await service.init();

    expect(service.user()).toEqual(fakeUser);
  });

  it('init si me falla debería hacer logout', async () => {
    tokenMock.getAccessToken.and.resolveTo('token');
    authMock.me.and.returnValue(throwError(() => new Error()));

    await service.init();

    expect(tokenMock.clearTokens).toHaveBeenCalled();
    expect(navMock.root).toHaveBeenCalledWith('/login');
  });

  it('login debería guardar tokens y setear user', (done) => {
    const response = {
      accessToken: 'a',
      refreshToken: 'r',
      user: fakeUser,
    };

    authMock.login.and.returnValue(of(response));
    tokenMock.setTokens.and.resolveTo();

    service.login({ identifier: 'x', password: 'x' }).subscribe({
      next: () => {
        expect(tokenMock.setTokens).toHaveBeenCalledWith('a', 'r');
        expect(service.user()).toEqual(fakeUser);
        done();
      },
    });
  });

  it('logout debería limpiar tokens y navegar', async () => {
    tokenMock.clearTokens.and.resolveTo();

    await service.logout();

    expect(tokenMock.clearTokens).toHaveBeenCalled();
    expect(service.user()).toBeNull();
    expect(navMock.root).toHaveBeenCalledWith('/login');
  });

  it('refresh exitoso debería actualizar tokens y user', async () => {
    const response = {
      accessToken: 'newA',
      refreshToken: 'newR',
      user: fakeUser,
    };

    authMock.refresh.and.returnValue(of(response));
    tokenMock.setTokens.and.resolveTo();

    await service.refresh();

    expect(tokenMock.setTokens).toHaveBeenCalledWith('newA', 'newR');
    expect(service.user()).toEqual(fakeUser);
  });

  it('refresh fallido debería hacer logout', async () => {
    authMock.refresh.and.returnValue(throwError(() => new Error()));

    tokenMock.clearTokens.and.resolveTo();

    await service.refresh();

    expect(tokenMock.clearTokens).toHaveBeenCalled();
    expect(navMock.root).toHaveBeenCalledWith('/login');
  });
});
