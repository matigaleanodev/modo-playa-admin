import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';

export abstract class ApiService {
  protected _http = inject(HttpClient);
  protected _api = environment.API_URL;
  protected _ruta: string;

  constructor(ruta: string = '') {
    this._ruta = ruta;
  }

  protected _path(path: string = ''): string {
    return `${this._api}/${this._ruta}${path ? `/${path}` : ''}`;
  }
}
