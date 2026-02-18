import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SKIP_AUTH } from '@auth/interceptors/token-interceptor';
import { AuthResponse } from '@auth/models/auth-response.model';
import { AuthUser } from '@auth/models/auth-user.model';
import { Credentials } from '@auth/models/credentials.model';
import { VerifiyCode } from '@auth/models/verifiy-code.model';
import { ApiService } from '@core/api/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends ApiService {
  constructor() {
    super('auth');
  }

  requestActivation(dto: {
    identifier: string;
  }): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(
      this._path('request-activation'),
      dto,
      {
        context: new HttpContext().set(SKIP_AUTH, true),
      },
    );
  }

  activate(dto: VerifiyCode): Observable<{ accessToken: string }> {
    return this._http.post<{ accessToken: string }>(
      this._path('activate'),
      dto,
      {
        context: new HttpContext().set(SKIP_AUTH, true),
      },
    );
  }

  setPassword(dto: { password: string }): Observable<AuthResponse> {
    return this._http.post<AuthResponse>(this._path('set-password'), dto);
  }

  login(credentials: Credentials): Observable<AuthResponse> {
    return this._http.post<AuthResponse>(this._path('login'), credentials, {
      context: new HttpContext().set(SKIP_AUTH, true),
    });
  }

  refresh(): Observable<AuthResponse> {
    return this._http.post<AuthResponse>(
      this._path('refresh'),
      {},
      {
        context: new HttpContext().set(SKIP_AUTH, true),
      },
    );
  }

  me(): Observable<AuthUser> {
    return this._http.get<AuthUser>(this._path('me'));
  }

  changePassword(dto: { password: string }): Observable<AuthResponse> {
    return this._http.post<AuthResponse>(this._path('change-password'), dto);
  }

  forgotPassword(dto: { identifier: string }): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(
      this._path('forgot-password'),
      dto,
      {
        context: new HttpContext().set(SKIP_AUTH, true),
      },
    );
  }

  verifyRequestCode(dto: VerifiyCode): Observable<{ accessToken: string }> {
    return this._http.post<{ accessToken: string }>(
      this._path('verify-reset-code'),
      dto,
      {
        context: new HttpContext().set(SKIP_AUTH, true),
      },
    );
  }

  resetPassword(dto: { password: string }): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(
      this._path('reset-password'),
      dto,
    );
  }
}
