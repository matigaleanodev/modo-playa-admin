import { Injectable } from '@angular/core';
import { CrudService } from '@core/crud/crud.service';
import { Contact } from '../models/contact.model';

@Injectable({
  providedIn: 'root',
})
export class ContactsCrudService extends CrudService<Contact> {
  constructor() {
    super('admin/contacts');
  }
}
