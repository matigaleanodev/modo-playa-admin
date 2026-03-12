import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ProfileChangePasswordPage } from './profile-change-password.page';
import { AuthService } from '@auth/services/auth.service';
import { SessionService } from '@auth/services/session.service';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { AuthResponse } from '@auth/models/auth-response.model';

describe('ProfileChangePasswordPage', () => {
  let component: ProfileChangePasswordPage;
  let fixture: ComponentFixture<ProfileChangePasswordPage>;
  let authMock: jasmine.SpyObj<AuthService>;
  let sessionMock: jasmine.SpyObj<SessionService>;
  let navMock: jasmine.SpyObj<NavService>;
  let toastrMock: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj<AuthService>('AuthService', ['changePassword']);
    sessionMock = jasmine.createSpyObj<SessionService>('SessionService', [
      'applyAuthResponse',
    ]);
    navMock = jasmine.createSpyObj<NavService>('NavService', ['root', 'back']);
    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', ['success']);

    authMock.changePassword.and.returnValue(of(createAuthResponse()));
    sessionMock.applyAuthResponse.and.resolveTo();
    toastrMock.success.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [ProfileChangePasswordPage],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: SessionService, useValue: sessionMock },
        { provide: NavService, useValue: navMock },
        { provide: ToastrService, useValue: toastrMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileChangePasswordPage);
    component = fixture.componentInstance;
  });

  it('debería marcar error si la confirmación no coincide', async () => {
    fixture.detectChanges();
    component.form.setValue({
      currentPassword: 'Actual1234',
      newPassword: 'Nueva1234',
      confirmNewPassword: 'Distinta1234',
    });

    await component.submit();

    expect(component.formError()).toContain('no coinciden');
    expect(authMock.changePassword).not.toHaveBeenCalled();
  });

  it('debería cambiar contraseña y refrescar sesión', async () => {
    fixture.detectChanges();
    component.form.setValue({
      currentPassword: 'Actual1234',
      newPassword: 'Nueva1234',
      confirmNewPassword: 'Nueva1234',
    });

    await component.submit();

    expect(authMock.changePassword).toHaveBeenCalledWith({
      currentPassword: 'Actual1234',
      newPassword: 'Nueva1234',
    });
    expect(sessionMock.applyAuthResponse).toHaveBeenCalled();
    expect(navMock.root).toHaveBeenCalledWith('/app/profile');
    expect(toastrMock.success).toHaveBeenCalled();
  });

  it('debería volver atrás al cancelar', () => {
    component.cancel();

    expect(navMock.back).toHaveBeenCalled();
  });

  it('debería mapear INVALID_CREDENTIALS al cambiar contraseña', async () => {
    authMock.changePassword.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { code: 'INVALID_CREDENTIALS' },
          }),
      ),
    );
    fixture.detectChanges();
    component.form.setValue({
      currentPassword: 'Actual1234',
      newPassword: 'Nueva1234',
      confirmNewPassword: 'Nueva1234',
    });

    await component.submit();

    expect(component.formError()).toBe('La contraseña actual no es válida.');
  });
});

function createAuthResponse(): AuthResponse {
  return {
    accessToken: 'a',
    refreshToken: 'r',
    user: {
      id: 'u1',
      email: 'admin@test.com',
      username: 'admin',
      role: 'OWNER',
    },
  };
}
