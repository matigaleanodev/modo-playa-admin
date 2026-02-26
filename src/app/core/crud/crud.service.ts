import { ApiService } from '@core/api/api.service';
import { ApiListQuery, ApiListResponse } from '@core/models/api-response.model';
import { BaseEntity } from '@core/models/entity.model';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export abstract class CrudService<T extends BaseEntity> extends ApiService {
  constructor(ruta: string) {
    super(ruta);
  }

  save(data: Partial<T>): Observable<T> {
    return this._http.post<T>(this._path(), data);
  }

  update(id: string, data: Partial<T>): Observable<T> {
    return this._http.put<T>(this._path(id), data);
  }

  delete(id: string): Observable<void> {
    return this._http.delete<void>(this._path(id));
  }

  findOne(id: string): Observable<T> {
    return this._http.get<T>(this._path(id));
  }

  find(query: ApiListQuery = {}): Observable<ApiListResponse<T>> {
    return this._http.get<ApiListResponse<T>>(this._path(), {
      params: this._buildParams(query),
    });
  }

  private _buildParams(query: ApiListQuery): HttpParams {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') continue;
      params = params.set(key, String(value));
    }

    return params;
  }
}
