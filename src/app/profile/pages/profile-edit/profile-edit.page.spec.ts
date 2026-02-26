import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ProfileEditPage } from './profile-edit.page';
import { AuthService } from '@auth/services/auth.service';
import { SessionService } from '@auth/services/session.service';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { AuthUser } from '@auth/models/auth-user.model';

describe('ProfileEditPage', () => {
  let component: ProfileEditPage;
  let fixture: ComponentFixture<ProfileEditPage>;
  let authMock: jasmine.SpyObj<AuthService>;
  let navMock: jasmine.SpyObj<NavService>;
  let toastrMock: jasmine.SpyObj<ToastrService>;
  let sessionMock: jasmine.SpyObj<SessionService> & {
    user: ReturnType<typeof signal<AuthUser | null>>;
  };

  beforeEach(async () => {
    authMock = jasmine.createSpyObj<AuthService>('AuthService', ['me', 'updateMe']);
    navMock = jasmine.createSpyObj<NavService>('NavService', ['root', 'back']);
    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', ['success']);
    toastrMock.success.and.resolveTo();

    const user = createUser();
    authMock.me.and.returnValue(of(user));
    authMock.updateMe.and.returnValue(of({ ...user, displayName: 'Mati' }));

    sessionMock = Object.assign(
      jasmine.createSpyObj<SessionService>('SessionService', ['setCurrentUser']),
      { user: signal<AuthUser | null>(user) },
    );

    await TestBed.configureTestingModule({
      imports: [ProfileEditPage],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: SessionService, useValue: sessionMock },
        { provide: NavService, useValue: navMock },
        { provide: ToastrService, useValue: toastrMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileEditPage);
    component = fixture.componentInstance;
  });

  it('debería precargar el formulario desde la sesión', () => {
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      firstName: 'Matias',
      lastName: 'Galeano',
      displayName: '',
      phone: '+549',
    });
  });

  it('debería actualizar perfil y volver a /app/profile', async () => {
    fixture.detectChanges();
    component.form.patchValue({
      displayName: ' Mati ',
      firstName: ' Matias ',
      lastName: '',
      phone: '',
    });

    await component.submit();

    expect(authMock.updateMe).toHaveBeenCalledWith({
      firstName: 'Matias',
      lastName: undefined,
      displayName: 'Mati',
      phone: undefined,
    });
    expect(sessionMock.setCurrentUser).toHaveBeenCalled();
    expect(navMock.root).toHaveBeenCalledWith('/app/profile');
  });

  it('debería volver atrás al cancelar', () => {
    component.cancel();

    expect(navMock.back).toHaveBeenCalled();
  });

  it('debería cargar desde auth/me si no hay usuario en sesión', async () => {
    sessionMock.user.set(null);

    fixture = TestBed.createComponent(ProfileEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authMock.me).toHaveBeenCalled();
    expect(sessionMock.setCurrentUser).toHaveBeenCalled();
  });
});

function createUser(): AuthUser {
  return {
    id: 'u1',
    email: 'admin@test.com',
    username: 'admin',
    firstName: 'Matias',
    lastName: 'Galeano',
    displayName: '',
    phone: '+549',
    role: 'OWNER',
  };
}
