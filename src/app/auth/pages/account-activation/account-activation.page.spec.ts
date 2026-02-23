import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AccountActivationPage } from './account-activation.page';
import { AccountActivationService } from '@auth/services/account-activation.service';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NavService } from '@shared/services/nav/nav.service';

describe('AccountActivationPage', () => {
  let component: AccountActivationPage;
  let fixture: ComponentFixture<AccountActivationPage>;
  let activationMock: jasmine.SpyObj<AccountActivationService>;
  let loadingMock: jasmine.SpyObj<LoadingService>;
  let navMock: jasmine.SpyObj<NavService>;
  let dismissMock: jasmine.Spy;

  beforeEach(async () => {
    activationMock = jasmine.createSpyObj<AccountActivationService>(
      'AccountActivationService',
      ['requestCode'],
    );
    loadingMock = jasmine.createSpyObj<LoadingService>('LoadingService', ['show']);
    navMock = jasmine.createSpyObj<NavService>('NavService', ['forward']);
    dismissMock = jasmine.createSpy('dismiss').and.resolveTo();

    loadingMock.show.and.resolveTo(dismissMock);

    await TestBed.configureTestingModule({
      imports: [AccountActivationPage],
      providers: [
        provideRouter([]),
        { provide: AccountActivationService, useValue: activationMock },
        { provide: LoadingService, useValue: loadingMock },
        { provide: NavService, useValue: navMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountActivationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('no debería enviar solicitud si el formulario es inválido', async () => {
    await component.onSubmit();

    expect(activationMock.requestCode).not.toHaveBeenCalled();
    expect(component.identifierErrorMessage).toBeTruthy();
  });

  it('debería solicitar activación y navegar al paso verify', fakeAsync(() => {
    activationMock.requestCode.and.returnValue(of({ message: 'dev message' }));
    component.form.setValue({ identifier: 'user@mail.com' });

    component.onSubmit();
    flushMicrotasks();

    expect(activationMock.requestCode).toHaveBeenCalledWith({
      identifier: 'user@mail.com',
    });
    expect(component.successMessage()).toContain('Si el usuario existe');
    expect(navMock.forward).toHaveBeenCalledWith('/auth/activate/verify');
    expect(dismissMock).toHaveBeenCalled();
  }));

  it('debería mostrar error si falla la solicitud', fakeAsync(() => {
    activationMock.requestCode.and.returnValue(throwError(() => new Error('fail')));
    component.form.setValue({ identifier: 'user' });

    component.onSubmit();
    flushMicrotasks();

    expect(component.requestError()).toContain('No pudimos procesar la solicitud');
    expect(navMock.forward).not.toHaveBeenCalled();
  }));
});
