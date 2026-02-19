import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { LoginPage } from './login.page';
import { SessionService } from '@auth/services/session.service';
import { LoadingService } from '@shared/services/loading/loading.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  let sessionMock: jasmine.SpyObj<SessionService>;
  let loadingMock: jasmine.SpyObj<LoadingService>;

  beforeEach(async () => {
    sessionMock = jasmine.createSpyObj('SessionService', ['login']);
    loadingMock = jasmine.createSpyObj('LoadingService', ['show']);

    loadingMock.show.and.resolveTo(async () => {});

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: sessionMock },
        { provide: LoadingService, useValue: loadingMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('no debería ejecutar login si el formulario es inválido', async () => {
    await component.onSubmit();

    expect(sessionMock.login).not.toHaveBeenCalled();
  });

  it('debería ejecutar login si el formulario es válido', fakeAsync(() => {
    sessionMock.login.and.returnValue(of(void 0));

    component.form.setValue({
      identifier: 'mati',
      password: '1234',
    });

    component.onSubmit();
    flushMicrotasks();

    expect(sessionMock.login).toHaveBeenCalledWith({
      identifier: 'mati',
      password: '1234',
    });
  }));

  it('debería ejecutar login y no navegar si falla', fakeAsync(() => {
    sessionMock.login.and.returnValue(throwError(() => new Error('error')));

    component.form.setValue({
      identifier: 'test@test.com',
      password: '1234',
    });

    component.onSubmit();

    flushMicrotasks();

    expect(sessionMock.login).toHaveBeenCalled();
  }));
});
