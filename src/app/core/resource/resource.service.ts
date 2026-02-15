import { CrudService } from '../crud/crud.service';
import { BaseEntity } from '../models/entity.model';

export abstract class ResourceService<T extends BaseEntity> {
  abstract _service: CrudService<T>;

  guardar(data: T) {}

  cancelar() {}

  newElement() {}

  editElement(dat: T) {}
}
