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
    service.refresh('refresh-token').subscribe();

    const req = httpMock.expectOne(`${API}/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect(req.request.headers.get('Authorization')).toBe(
      'Bearer refresh-token',
    );

    req.flush({ accessToken: '', refreshToken: '', user: {} });
  });

  it('debería llamar a me', () => {
    service.me().subscribe();

    const req = httpMock.expectOne(`${API}/me`);
    expect(req.request.method).toBe('GET');

    req.flush({});
  });

  it('debería llamar a updateMe', () => {
    const dto = {
      firstName: 'Matias',
      lastName: 'Galeano',
      displayName: 'Mati',
      phone: '+549...',
    };

    service.updateMe(dto).subscribe();

    const req = httpMock.expectOne(`${API}/me`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(dto);

    req.flush({});
  });

  it('debería llamar a change-password', () => {
    const dto = {
      currentPassword: 'Password123',
      newPassword: 'NuevaPassword456',
    };

    service.changePassword(dto).subscribe();

    const req = httpMock.expectOne(`${API}/change-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);

    req.flush({ accessToken: '', refreshToken: '', user: {} });
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
