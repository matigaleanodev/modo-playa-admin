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

  protected override getLoadErrorSubject(): string {
    return 'los alojamientos';
  }

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

    const price = this._toFiniteNumber(data.price);
    const maxGuests = this._toFiniteNumber(data.maxGuests);
    const bedrooms = this._toFiniteNumber(data.bedrooms);
    const bathrooms = this._toFiniteNumber(data.bathrooms);
    const minNights = this._toFiniteNumber(data.minNights);
    const distanceToBeach = this._toOptionalFiniteNumber(data.distanceToBeach);

    return {
      ...data,
      title: data.title.trim(),
      description: data.description.trim(),
      location: data.location.trim(),
      city: data.city.trim(),
      type: data.type,
      price: price !== null ? Math.max(0, price) : 0,
      priceUnit: data.priceUnit,
      maxGuests: maxGuests !== null ? Math.max(1, Math.trunc(maxGuests)) : 1,
      bedrooms: bedrooms !== null ? Math.max(0, Math.trunc(bedrooms)) : 0,
      bathrooms: bathrooms !== null ? Math.max(0, Math.trunc(bathrooms)) : 0,
      minNights: minNights !== null ? Math.max(1, Math.trunc(minNights)) : 1,
      distanceToBeach:
        distanceToBeach !== null ? Math.max(0, Math.trunc(distanceToBeach)) : null,
      amenities: amenities as LodgingAmenity[],
      mainImage: data.mainImage.trim(),
      images,
      contactId: data.contactId ? data.contactId.trim() : null,
      isPubliclyVisible: !!data.isPubliclyVisible,
    };
  }

  private _toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().replace(',', '.');
      if (normalized === '') {
        return null;
      }

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private _toOptionalFiniteNumber(value: unknown): number | null {
    return this._toFiniteNumber(value);
  }
}
