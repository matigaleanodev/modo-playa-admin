import { Injectable, inject } from '@angular/core';
import { ResourceService } from '@core/resource/resource.service';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { Contact } from '../models/contact.model';
import { ContactsCrudService } from './contacts-crud.service';

export type ContactSaveDto = Contact;
export type ContactCreateDto = Omit<Contact, 'id'>;

export function createEmptyContact(): Contact {
  return {
    id: '',
    name: '',
    email: '',
    whatsapp: '',
    isDefault: false,
    notes: '',
  };
}

@Injectable({
  providedIn: 'root',
})
export class ContactsResourceService extends ResourceService<
  Contact,
  ContactCreateDto,
  ContactSaveDto
> {
  override _service = inject(ContactsCrudService);

  private readonly _nav = inject(NavService);
  private readonly _toastr = inject(ToastrService);

  async guardar(data: ContactSaveDto): Promise<void> {
    const payload = this._normalizePayload(data);
    const id = payload.id?.trim();

    if (id) {
      const updated = await this.updateAndRefresh(id, payload);
      await this._toastr.success(
        `Contacto "${updated.name}" actualizado correctamente.`,
        'Edición completada',
      );
    } else {
      const created = await this.createAndRefresh(this._toCreatePayload(payload));
      await this._toastr.success(
        `Contacto "${created.name}" creado correctamente.`,
        'Alta completada',
      );
    }

    this._nav.root('/app/contacts');
  }

  cancelar(): void {
    this._nav.root('/app/contacts');
  }

  newElement(): void {
    this._nav.forward('/app/contacts/new');
  }

  editElement(dat: Contact): void {
    this._nav.forward(`/app/contacts/${dat.id}`);
  }

  private _normalizePayload(data: ContactSaveDto): ContactSaveDto {
    return {
      id: data.id ?? '',
      name: data.name.trim(),
      email: data.email?.trim().toLowerCase() || '',
      whatsapp: data.whatsapp?.trim() || '',
      isDefault: !!data.isDefault,
      notes: data.notes?.trim() || '',
    };
  }

  private _toCreatePayload(payload: ContactSaveDto): ContactCreateDto {
    const { id: _id, ...createPayload } = payload;
    return createPayload;
  }
}
