import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { TokenService } from '../services/token.service';
import { SessionService } from '../services/session.service';
import { tokenInterceptor } from './token-interceptor';

describe('tokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  let tokenMock: jasmine.SpyObj<TokenService>;
  let sessionMock: jasmine.SpyObj<SessionService>;

  beforeEach(() => {
    tokenMock = jasmine.createSpyObj('TokenService', ['getAccessToken']);

    sessionMock = jasmine.createSpyObj('SessionService', ['refreshControlled']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenService, useValue: tokenMock },
        { provide: SessionService, useValue: sessionMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería agregar Authorization header si hay token', fakeAsync(() => {
    tokenMock.getAccessToken.and.resolveTo('fake-token');

    http.get('/test').subscribe();

    flushMicrotasks();

    const req = httpMock.expectOne('/test');

    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    req.flush({});
  }));

  it('no debería agregar header si no hay token', fakeAsync(() => {
    tokenMock.getAccessToken.and.resolveTo(null);

    http.get('/test').subscribe();

    flushMicrotasks();

    const req = httpMock.expectOne('/test');

    expect(req.request.headers.has('Authorization')).toBeFalse();

    req.flush({});
  }));

  it('debería intentar refresh ante 401 y reintentar request', fakeAsync(() => {
    tokenMock.getAccessToken.and.returnValues(
      Promise.resolve('expired-token'),
      Promise.resolve('new-token'),
    );

    sessionMock.refreshControlled.and.resolveTo();

    http.get('/secure').subscribe();

    flushMicrotasks();

    const firstReq = httpMock.expectOne('/secure');

    firstReq.flush({}, { status: 401, statusText: 'Unauthorized' });

    flushMicrotasks();

    const retryReq = httpMock.expectOne('/secure');

    expect(retryReq.request.headers.get('Authorization')).toBe(
      'Bearer new-token',
    );

    retryReq.flush({});
  }));

  it('debería propagar error si refresh falla', fakeAsync(() => {
    tokenMock.getAccessToken.and.resolveTo('expired-token');

    sessionMock.refreshControlled.and.rejectWith(new Error('refresh failed'));

    let errorReceived: any;

    http.get('/secure').subscribe({
      error: (err) => (errorReceived = err),
    });

    flushMicrotasks();

    const firstReq = httpMock.expectOne('/secure');

    firstReq.flush({}, { status: 401, statusText: 'Unauthorized' });

    flushMicrotasks();

    expect(errorReceived).toBeTruthy();
  }));
});
