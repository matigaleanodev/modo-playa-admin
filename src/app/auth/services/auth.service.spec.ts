import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '@env/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const API = environment.API_URL + '/auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería llamar a request-activation', () => {
    const dto = { identifier: 'test@mail.com' };

    service.requestActivation(dto).subscribe();

    const req = httpMock.expectOne(`${API}/request-activation`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);

    req.flush({ message: 'ok' });
  });

  it('debería llamar a login', () => {
    const credentials = { email: 'test@mail.com', password: '1234' };

    service.login(credentials as any).subscribe();

    const req = httpMock.expectOne(`${API}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);

    req.flush({ accessToken: '', refreshToken: '', user: {} });
  });

  it('debería llamar a refresh', () => {
    service.refresh().subscribe();

    const req = httpMock.expectOne(`${API}/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});

    req.flush({ accessToken: '', refreshToken: '', user: {} });
  });

  it('debería llamar a me', () => {
    service.me().subscribe();

    const req = httpMock.expectOne(`${API}/me`);
    expect(req.request.method).toBe('GET');

    req.flush({});
  });

  it('debería llamar a reset-password', () => {
    const dto = { password: 'newpass' };

    service.resetPassword(dto).subscribe();

    const req = httpMock.expectOne(`${API}/reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);

    req.flush({ message: 'ok' });
  });
});
