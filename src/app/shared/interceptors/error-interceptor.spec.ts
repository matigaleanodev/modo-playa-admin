import { TestBed } from '@angular/core/testing';
import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { TimeoutError, throwError } from 'rxjs';

import { errorInterceptor } from './error-interceptor';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { TranslateService } from '@shared/translate/translate.service';

describe('errorInterceptor', () => {
  const toastrMock = {
    danger: jasmine.createSpy('danger'),
  };

  const translateMock = {
    translate: jasmine
      .createSpy('translate')
      .and.callFake((key: string) => key),
  };

  const interceptor = (req: HttpRequest<any>, next: HttpHandlerFn) =>
    TestBed.runInInjectionContext(() => errorInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ToastrService, useValue: toastrMock },
        { provide: TranslateService, useValue: translateMock },
      ],
    });
  });

  it('debería manejar TimeoutError', (done) => {
    const req = new HttpRequest('GET', '/test');

    const next: HttpHandlerFn = () => throwError(() => new TimeoutError());

    interceptor(req, next).subscribe({
      error: (error) => {
        expect(error instanceof TimeoutError).toBeTrue();
        expect(translateMock.translate).toHaveBeenCalledWith('xErrorTimeout');
        expect(toastrMock.danger).toHaveBeenCalledWith('xErrorTimeout');
        done();
      },
    });
  });

  it('debería manejar HttpErrorResponse de conexión', (done) => {
    const req = new HttpRequest('GET', '/test');

    const httpError = new HttpErrorResponse({
      status: 0,
      url: '/test',
      error: new ProgressEvent('error'),
    });

    const next: HttpHandlerFn = () => throwError(() => httpError);

    interceptor(req, next).subscribe({
      error: (error) => {
        expect(error).toBe(httpError);
        expect(translateMock.translate).toHaveBeenCalledWith('xErrorConexion');
        expect(toastrMock.danger).toHaveBeenCalledWith('xErrorConexion');
        done();
      },
    });
  });

  it('debería manejar HttpErrorResponse genérico', (done) => {
    const req = new HttpRequest('GET', '/test');

    const httpError = new HttpErrorResponse({
      status: 500,
      url: '/test',
      error: { message: 'boom' },
    });

    const next: HttpHandlerFn = () => throwError(() => httpError);

    interceptor(req, next).subscribe({
      error: (error) => {
        expect(error).toBe(httpError);
        expect(translateMock.translate).toHaveBeenCalledWith(
          'xErrorDesconocido',
        );
        expect(toastrMock.danger).toHaveBeenCalledWith('xErrorDesconocido');
        done();
      },
    });
  });
});
