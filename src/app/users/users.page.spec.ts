import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { UsersPage } from './users.page';
import { UsersCrudService } from './services/users-crud.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { ApiListResponse } from '@core/models/api-response.model';
import { AdminUser } from './models/user-admin.model';

describe('UsersPage', () => {
  let component: UsersPage;
  let fixture: ComponentFixture<UsersPage>;
  let usersServiceMock: jasmine.SpyObj<UsersCrudService>;
  let toastrMock: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    usersServiceMock = jasmine.createSpyObj<UsersCrudService>('UsersCrudService', [
      'find',
      'save',
    ]);
    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', [
      'success',
      'danger',
    ]);

    usersServiceMock.find.and.returnValue(of(createUsersListResponse()));
    usersServiceMock.save.and.returnValue(of(createAdminUser()));
    toastrMock.success.and.resolveTo();
    toastrMock.danger.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [
        { provide: UsersCrudService, useValue: usersServiceMock },
        { provide: ToastrService, useValue: toastrMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPage);
    component = fixture.componentInstance;
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar usuarios al iniciar y actualizar el resumen', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(usersServiceMock.find).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(component.users().length).toBe(1);
    expect(component.total()).toBe(1);
    expect(component.remainingSlots()).toBe(2);
    expect(component.limitReached()).toBeFalse();
  });

  it('debería deshabilitar el alta cuando se alcanza el límite', async () => {
    usersServiceMock.find.and.returnValue(
      of(createUsersListResponse({ total: 3, data: [createAdminUser(), createAdminUser({ id: 'u2' }), createAdminUser({ id: 'u3' })] })),
    );

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.limitReached()).toBeTrue();
    expect(component.canCreateMore()).toBeFalse();

    component.toggleForm();

    expect(component.formOpen()).toBeFalse();
  });

  it('debería crear usuario, cerrar formulario y recargar lista', async () => {
    usersServiceMock.find.and.returnValues(
      of(createUsersListResponse()),
      of(
        createUsersListResponse({
          total: 2,
          data: [createAdminUser(), createAdminUser({ id: 'u2', username: 'nuevo' })],
        }),
      ),
    );
    usersServiceMock.save.and.returnValue(
      of(createAdminUser({ id: 'u2', username: 'nuevo', email: 'nuevo@test.com' })),
    );

    fixture.detectChanges();
    await fixture.whenStable();

    component.toggleForm();
    component.createForm.setValue({
      username: 'Nuevo',
      email: 'Nuevo@Test.com',
    });

    await component.submit();

    expect(usersServiceMock.save).toHaveBeenCalledWith({
      username: 'nuevo',
      email: 'nuevo@test.com',
    });
    expect(toastrMock.success).toHaveBeenCalled();
    expect(component.formOpen()).toBeFalse();
    expect(usersServiceMock.find).toHaveBeenCalledTimes(2);
    expect(component.total()).toBe(2);
  });

  it('no debería intentar guardar si el formulario es inválido', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.toggleForm();
    component.createForm.setValue({
      username: 'ab',
      email: 'invalido',
    });

    await component.submit();

    expect(usersServiceMock.save).not.toHaveBeenCalled();
  });

  it('debería reflejar error al cargar usuarios', async () => {
    usersServiceMock.find.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'Error de carga' },
          }),
      ),
    );

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.loadError()).toBe('Error de carga');
  });

  it('debería resolver etiquetas de estado de usuario', () => {
    expect(
      component.userStatusLabel(createAdminUser({ isActive: false, isPasswordSet: true })),
    ).toBe('Inactivo');
    expect(
      component.userStatusLabel(createAdminUser({ isActive: true, isPasswordSet: false })),
    ).toBe('Pendiente de activación');
    expect(
      component.userStatusLabel(createAdminUser({ isActive: true, isPasswordSet: true })),
    ).toBe('Activo');

    expect(
      component.userStatusTone(createAdminUser({ isActive: false, isPasswordSet: true })),
    ).toBe('inactive');
    expect(
      component.userStatusTone(createAdminUser({ isActive: true, isPasswordSet: false })),
    ).toBe('pending');
    expect(
      component.userStatusTone(createAdminUser({ isActive: true, isPasswordSet: true })),
    ).toBe('active');
  });
});

function createAdminUser(partial: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'u1',
    username: 'admin',
    email: 'admin@test.com',
    isActive: true,
    isPasswordSet: false,
    ...partial,
  };
}

function createUsersListResponse(
  partial: Partial<ApiListResponse<AdminUser>> = {},
): ApiListResponse<AdminUser> {
  return {
    data: [createAdminUser()],
    total: 1,
    page: 1,
    limit: 10,
    ...partial,
  };
}
