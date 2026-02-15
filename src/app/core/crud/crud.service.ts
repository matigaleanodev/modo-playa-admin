import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { BaseEntity } from '../models/entity.model';
import { ApiListResponse } from '../models/api-response.model';

export abstract class CrudService<T extends BaseEntity> extends ApiService {
  constructor(ruta: string) {
    super(ruta);
  }

  save(data: Partial<T>): Observable<T> {
    return this._http.post<T>(this._path(), data);
  }

  update(data: Partial<T>): Observable<T> {
    return this._http.put<T>(this._path(), data);
  }

  delete(data: Partial<T>): Observable<T> {
    return this._http.delete<T>(this._path(data.id));
  }

  findOne(data: Partial<T>): Observable<T> {
    return this._http.get<T>(this._path(data.id));
  }

  findAll(): Observable<ApiListResponse<T[]>> {
    return this._http.get<ApiListResponse<T[]>>(this._path());
  }
}
