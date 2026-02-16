import { inject, InputSignal, linkedSignal } from '@angular/core';
import { BaseEntity } from '@core/models/entity.model';
import { ResourceService } from '@core/resource/resource.service';
import { DialogService } from '@shared/services/dialog/dialog.service';

export abstract class BaseList<T extends BaseEntity> {
  abstract readonly initialList: InputSignal<T[]>;

  readonly entities = linkedSignal<T[]>(() => this.initialList());

  protected abstract _service: ResourceService<T>;
  private readonly _dialog = inject(DialogService);

  async onDelete(el: T) {
    const confirmed = await this._dialog.confirm({
      title: 'Confirmar Eliminar',
      text: 'Desea eliminar el elemento',
    });

    if (!confirmed) return;

    this._service.delete(el);
    // .subscribe(() => {
    //   this.items.update(list => list.filter(i => i.id !== el.id));
    // });
  }

  editElement(el: T) {
    this._service.editElement(el);
  }

  newElement(): void {
    this._service.newElement();
  }
}
