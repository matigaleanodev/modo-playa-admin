import { ApiService } from '@core/api/api.service';
import { ApiListResponse } from '@core/models/api-response.model';
import { BaseEntity } from '@core/models/entity.model';
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

  findAll(): Observable<ApiListResponse<T[]>> {
    return this._http.get<ApiListResponse<T[]>>(this._path());
  }
}
