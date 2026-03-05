import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from '@core/crud/crud.service';
import { Lodging } from '@lodgings/models/lodging.model';

@Injectable({
  providedIn: 'root',
})
export class LodgingsCrudService extends CrudService<Lodging> {
  constructor() {
    super('admin/lodgings');
  }

  createWithImages(
    payload: Record<string, unknown>,
    files: File[],
  ): Observable<Lodging> {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));

    for (const file of files) {
      formData.append('images', file, file.name);
    }

    return this._http.post<Lodging>(this._path('with-images'), formData);
  }

  updateWithImages(
    id: string,
    payload: Record<string, unknown>,
    files: File[],
  ): Observable<Lodging> {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));

    for (const file of files) {
      formData.append('images', file, file.name);
    }

    return this._http.patch<Lodging>(this._path(`${id}/with-images`), formData);
  }
}
