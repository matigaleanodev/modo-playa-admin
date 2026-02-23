import { Injectable } from '@angular/core';
import { CrudService } from '@core/crud/crud.service';
import { Lodging } from '@lodgings/models/lodging.model';

@Injectable({
  providedIn: 'root',
})
export class LodgingsCrudService extends CrudService<Lodging> {
  constructor() {
    super('admin/lodgings');
  }
}
