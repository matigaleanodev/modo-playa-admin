import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProfileViewPage } from './profile-view.page';
import { AuthService } from '@auth/services/auth.service';
import { SessionService } from '@auth/services/session.service';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { ProfileImageService } from '../../services/profile-image.service';
import { AuthUser } from '@auth/models/auth-user.model';
import { stubIonMenuButton } from '@shared/testing/menu-button-test.util';

describe('ProfileViewPage', () => {
  let component: ProfileViewPage;
  let fixture: ComponentFixture<ProfileViewPage>;
  let authMock: jasmine.SpyObj<AuthService>;
  let navMock: jasmine.SpyObj<NavService>;
  let toastrMock: jasmine.SpyObj<ToastrService>;
  let imageMock: jasmine.SpyObj<ProfileImageService>;
  let sessionMock: jasmine.SpyObj<SessionService> & {
    user: ReturnType<typeof signal<AuthUser | null>>;
  };

  beforeEach(async () => {
    stubIonMenuButton(ProfileViewPage);

    authMock = jasmine.createSpyObj<AuthService>('AuthService', ['me']);
    navMock = jasmine.createSpyObj<NavService>('NavService', ['forward']);
    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', ['success']);
    imageMock = jasmine.createSpyObj<ProfileImageService>('ProfileImageService', [
      'uploadOwnProfileImage',
      'deleteOwnProfileImage',
    ]);

    const user = createUser();
    authMock.me.and.returnValue(of(user));
    toastrMock.success.and.resolveTo();
    imageMock.uploadOwnProfileImage.and.resolveTo(user.profileImage!);
    imageMock.deleteOwnProfileImage.and.resolveTo(true);

    sessionMock = Object.assign(
      jasmine.createSpyObj<SessionService>('SessionService', ['setCurrentUser']),
      { user: signal<AuthUser | null>(user) },
    );

    await TestBed.configureTestingModule({
      imports: [ProfileViewPage],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: SessionService, useValue: sessionMock },
        { provide: NavService, useValue: navMock },
        { provide: ToastrService, useValue: toastrMock },
        { provide: ProfileImageService, useValue: imageMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileViewPage);
    component = fixture.componentInstance;
  });

  it('debería cargar el perfil al iniciar', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authMock.me).toHaveBeenCalled();
    expect(sessionMock.setCurrentUser).toHaveBeenCalled();
    expect(component.displayName()).toBe('Matias Galeano');
    expect(component.hasProfileImage()).toBeTrue();
  });

  it('debería navegar a editar perfil y cambiar contraseña', () => {
    component.goToEdit();
    component.goToChangePassword();

    expect(navMock.forward).toHaveBeenCalledWith('/app/profile/edit');
    expect(navMock.forward).toHaveBeenCalledWith('/app/profile/change-password');
  });

  it('debería subir imagen de perfil y refrescar estado', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    authMock.me.calls.reset();
    sessionMock.setCurrentUser.calls.reset();

    const file = new File(['img'], 'perfil.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [file],
    });

    await component.onProfileImageSelected({ target: input } as unknown as Event);

    expect(imageMock.uploadOwnProfileImage).toHaveBeenCalledWith(file);
    expect(authMock.me).toHaveBeenCalled();
    expect(toastrMock.success).toHaveBeenCalled();
  });

  it('debería conservar una imagen fallida para reintentarla sin reselección', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    imageMock.uploadOwnProfileImage.and.rejectWith(
      new HttpErrorResponse({
        status: 503,
        error: { message: 'Fallo temporal.' },
      }),
    );

    const file = new File(['img'], 'perfil.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [file],
    });

    await component.onProfileImageSelected({ target: input } as unknown as Event);

    expect(component.hasPendingProfileRetry()).toBeTrue();
    expect(component.pendingProfileImageFile()).toBe(file);
    expect(component.error()).toBe('Fallo temporal.');
  });

  it('debería reintentar la última imagen fallida y limpiar el estado pendiente al completar', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const file = new File(['img'], 'perfil.png', { type: 'image/png' });
    component.pendingProfileImageFile.set(file);
    component.pendingProfileImagePreviewUrl.set('blob:perfil');
    component.pendingProfileImageStatus.set('failed');
    authMock.me.calls.reset();

    await component.retryPendingProfileImage();

    expect(imageMock.uploadOwnProfileImage).toHaveBeenCalledWith(file);
    expect(component.hasPendingProfileRetry()).toBeFalse();
    expect(component.pendingProfileImageFile()).toBeNull();
    expect(authMock.me).toHaveBeenCalled();
  });

  it('debería permitir descartar una imagen pendiente fallida', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.pendingProfileImageFile.set(new File(['img'], 'perfil.png', { type: 'image/png' }));
    component.pendingProfileImagePreviewUrl.set('blob:perfil');
    component.pendingProfileImageStatus.set('failed');
    spyOn(URL, 'revokeObjectURL');

    component.discardPendingProfileImage();

    expect(component.pendingProfileImageFile()).toBeNull();
    expect(component.pendingProfileImagePreviewUrl()).toBeNull();
    expect(component.hasPendingProfileRetry()).toBeFalse();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:perfil');
  });

  it('debería eliminar imagen de perfil y refrescar estado', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    authMock.me.calls.reset();

    await component.removeProfileImage();

    expect(imageMock.deleteOwnProfileImage).toHaveBeenCalled();
    expect(authMock.me).toHaveBeenCalled();
    expect(toastrMock.success).toHaveBeenCalled();
  });

  it('debería reflejar cambios del usuario en sesión sin recargar la vista', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    sessionMock.user.set({
      ...createUser(),
      firstName: 'Ana',
      lastName: 'Perez',
      displayName: 'Ani',
    });
    fixture.detectChanges();

    expect(component.displayName()).toBe('Ana Perez');
    expect(component.valueOrDash(component.user()?.firstName)).toBe('Ana');
  });

  it('debería ocultar la gestión de imagen para SUPERADMIN', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    sessionMock.user.set({
      ...createUser(),
      role: 'SUPERADMIN',
    });
    fixture.detectChanges();

    expect(component.canManageProfileImage()).toBeFalse();
  });

  it('debería exponer un mensaje consistente si falla la carga inicial', async () => {
    authMock.me.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
          }),
      ),
    );

    fixture = TestBed.createComponent(ProfileViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error()).toBe(
      'No pudimos cargar los datos del perfil. Intenta nuevamente en unos minutos.',
    );
  });
});

function createUser(): AuthUser {
  return {
    id: 'u1',
    email: 'admin@test.com',
    username: 'admin',
    firstName: 'Matias',
    lastName: 'Galeano',
    role: 'OWNER',
    profileImage: {
      imageId: 'img1',
      key: 'users/u1/profile/img1/original.webp',
      createdAt: new Date().toISOString(),
      url: 'https://cdn.test/users/u1/profile/img1/original.webp',
    },
  };
}
