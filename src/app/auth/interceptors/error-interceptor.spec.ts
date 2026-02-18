import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { ToastrService } from '@shared/services/toastr/toastr.service';
import { ERROR_MESSAGES } from '@core/constants/error-message';
import { domainErrorInterceptor } from './error-interceptor';

describe('domainErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  const toastrMock = {
    danger: jasmine.createSpy('danger'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ToastrService, useValue: toastrMock },
        provideHttpClient(withInterceptors([domainErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    toastrMock.danger.calls.reset();
  });

  it('debería mostrar mensaje correspondiente al code', () => {
    http.get('/test').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/test');

    req.flush(
      { code: 'USER_NOT_FOUND' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(toastrMock.danger).toHaveBeenCalledWith(
      ERROR_MESSAGES.USER_NOT_FOUND,
    );
  });

  it('debería mostrar mensaje genérico si no hay code', () => {
    http.get('/test').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/test');

    req.flush(
      { message: 'algo raro' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(toastrMock.danger).toHaveBeenCalledWith(
      'Ocurrió un error inesperado.',
    );
  });

  it('no debería mostrar toast para 401', () => {
    http.get('/secure').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/secure');

    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(toastrMock.danger).not.toHaveBeenCalled();
  });

  it('debería propagar el error', (done) => {
    http.get('/test').subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
        done();
      },
    });

    const req = httpMock.expectOne('/test');

    req.flush(
      { code: 'USER_NOT_FOUND' },
      { status: 400, statusText: 'Bad Request' },
    );
  });
});
