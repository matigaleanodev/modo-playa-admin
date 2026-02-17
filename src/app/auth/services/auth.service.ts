import { Injectable } from '@angular/core';
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
    );
  }

  activate(dto: VerifiyCode): Observable<{ accessToken: string }> {
    return this._http.post<{ accessToken: string }>(
      this._path('activate'),
      dto,
    );
  }

  setPassword(dto: { password: string }): Observable<AuthResponse> {
    return this._http.post<AuthResponse>(this._path('set-password'), dto);
  }

  login(credentials: Credentials): Observable<AuthResponse> {
    return this._http.post<AuthResponse>(this._path('login'), credentials);
  }

  refresh(): Observable<AuthResponse> {
    return this._http.post<AuthResponse>(this._path('refresh'), {});
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
    );
  }

  verifyRequestCode(dto: VerifiyCode): Observable<{ accessToken: string }> {
    return this._http.post<{ accessToken: string }>(
      this._path('verify-reset-code'),
      dto,
    );
  }

  resetPassword(dto: { password: string }): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(
      this._path('reset-password'),
      dto,
    );
  }
}
