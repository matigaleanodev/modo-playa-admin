import { Injectable } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends ApiService {
  constructor() {
    super('Auth');
  }

  requestActivation(dto: {
    identifier: string;
  }): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(
      this._path('request-activation'),
      dto,
    );
  }

  activate() {}
  setPassword() {}
  login() {}
  refresh() {}
  me() {}
  changePassword() {}
  forgotPasswowd() {}
  verifiRequestCode() {}
  resetPassword() {}
}
