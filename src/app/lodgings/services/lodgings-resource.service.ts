import { computed, inject, Injectable, signal } from '@angular/core';
import { ResourceService } from '@core/resource/resource.service';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import {
  LodgingAmenity,
  Lodging,
  LodgingSaveDto,
  createEmptyLodging,
} from '@lodgings/models/lodging.model';
import { LodgingsCrudService } from './lodgings-crud.service';

@Injectable({
  providedIn: 'root',
})
export class LodgingsResourceService extends ResourceService<
  Lodging,
  LodgingSaveDto,
  LodgingSaveDto
> {
  override _service = inject(LodgingsCrudService);

  private readonly _nav = inject(NavService);
  private readonly _toastr = inject(ToastrService);

  private readonly _current = signal<Lodging | null>(null);
  readonly current = this._current.asReadonly();
  readonly isEditMode = computed(() => !!this._current()?.id);

  setCurrent(lodging: Lodging | null): void {
    this._current.set(lodging);
  }

  resetCurrent(): void {
    this._current.set(null);
  }

  normalizePayloadForSave(data: LodgingSaveDto): LodgingSaveDto {
    return this._normalizePayload(data);
  }

  async guardar(data: LodgingSaveDto): Promise<void> {
    const payload = this._normalizePayload(data);

    if (this.isEditMode()) {
      const current = this._current();

      if (!current?.id) {
        throw new Error('No hay alojamiento seleccionado para editar.');
      }

      const updated = await this.updateAndRefresh(current.id, payload);
      this._current.set(updated);
      await this._toastr.success(
        'Alojamiento actualizado correctamente.',
        'Edición completada',
      );
    } else {
      const created = await this.createAndRefresh(payload);
      this._current.set(created);
      await this._toastr.success(
        'Alojamiento creado correctamente.',
        'Alta completada',
      );
    }

    this._nav.root('/app/lodgings');
  }

  cancelar(): void {
    this._current.set(null);
    this._nav.root('/app/lodgings');
  }

  newElement(): void {
    this._current.set(createEmptyLodging());
    this._nav.forward('/app/lodgings/new');
  }

  editElement(dat: Lodging): void {
    this._current.set(dat);
    this._nav.forward(`/app/lodgings/${dat.id}`);
  }

  openAvailability(dat: Lodging): void {
    this._current.set(dat);
    this._nav.forward(`/app/lodgings/${dat.id}/availability`);
  }

  private _normalizePayload(data: LodgingSaveDto): LodgingSaveDto {
    const amenities = Array.isArray(data.amenities)
      ? data.amenities.filter(Boolean)
      : [];
    const images = Array.isArray(data.images)
      ? data.images.map((image) => image.trim()).filter(Boolean)
      : [];

    return {
      ...data,
      title: data.title.trim(),
      description: data.description.trim(),
      location: data.location.trim(),
      city: data.city.trim(),
      type: data.type,
      price: Number.isFinite(data.price) ? Math.max(0, Number(data.price)) : 0,
      priceUnit: data.priceUnit,
      maxGuests: Number.isFinite(data.maxGuests)
        ? Math.max(1, Math.trunc(data.maxGuests))
        : 1,
      bedrooms: Number.isFinite(data.bedrooms)
        ? Math.max(0, Math.trunc(data.bedrooms))
        : 0,
      bathrooms: Number.isFinite(data.bathrooms)
        ? Math.max(0, Math.trunc(data.bathrooms))
        : 0,
      minNights: Number.isFinite(data.minNights)
        ? Math.max(1, Math.trunc(data.minNights))
        : 1,
      distanceToBeach:
        data.distanceToBeach === null ||
        data.distanceToBeach === undefined ||
        data.distanceToBeach === ('' as unknown as number)
          ? null
          : Math.max(0, Math.trunc(Number(data.distanceToBeach))),
      amenities: amenities as LodgingAmenity[],
      mainImage: data.mainImage.trim(),
      images,
      contactId: data.contactId ? data.contactId.trim() : null,
      active: !!data.active,
    };
  }
}
