import { TestBed } from '@angular/core/testing';
import { SessionService } from '../services/session.service';
import { NavService } from '@shared/services/nav/nav.service';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  let sessionMock: any;
  let navMock: jasmine.SpyObj<NavService>;

  beforeEach(() => {
    sessionMock = {
      isAuthenticated: jasmine.createSpy(),
    };

    navMock = jasmine.createSpyObj('NavService', ['root']);

    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: sessionMock },
        { provide: NavService, useValue: navMock },
      ],
    });
  });

  it('debería permitir navegación si está autenticado', () => {
    sessionMock.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any),
    );

    expect(result).toBeTrue();
  });

  it('debería redirigir a login si no está autenticado', () => {
    sessionMock.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any),
    );

    expect(navMock.root).toHaveBeenCalledWith('/login');
    expect(result).toBeFalse();
  });
});
