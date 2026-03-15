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
      title: 'Eliminar elemento',
      itemLabel: this.getDeleteItemLabel(el),
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      color: 'danger',
      showIcon: true,
    });

    if (!confirmed) return;

    await this._service.delete(el);
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

  private getDeleteItemLabel(el: T): string {
    const candidate = [
      this.getStringValue(el, 'title'),
      this.getStringValue(el, 'name'),
      this.getStringValue(el, 'displayName'),
      this.getStringValue(el, 'username'),
      this.getStringValue(el, 'email'),
    ].find((value) => !!value);

    return candidate ?? el.id;
  }

  private getStringValue<K extends string>(
    entity: T,
    key: K,
  ): string | null {
    const value = (entity as T & Record<K, unknown>)[key];
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized || null;
  }
}
