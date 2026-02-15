import { InputSignal } from '@angular/core';
import { BaseEntity } from '@core/models/entity.model';
import { ResourceService } from '@core/resource/resource.service';

export abstract class BaseList<T extends BaseEntity> {
  abstract readonly data: InputSignal<T[]>;

  protected abstract _service: ResourceService<T>;

  eliminarElemento(el: T, descripcion: string) {
    //   const call = this._service.confirmarEliminar(el, descripcion);
    //   if (call) {
    //     call.subscribe({
    //       next: () => {
    //         const idKey = (this._service as any)._idKey as K;
    //         const filtered = this.data().filter((i) => i[idKey] !== el[idKey]);
    //         this.data.set(filtered);
    //       },
    //     });
    //   }
    // }
  }

  editElement(el: T) {
    this._service.editElement(el);
  }

  newElement(): void {
    this._service.newElement();
  }
}
