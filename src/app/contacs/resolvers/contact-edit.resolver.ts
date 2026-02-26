import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Contact } from '../models/contact.model';
import { ContactsCrudService } from '../services/contacts-crud.service';

export const contactEditResolver: ResolveFn<Contact> = async (route) => {
  const id = route.paramMap.get('id');

  if (!id) {
    throw new Error('Parametro "id" requerido para editar contacto.');
  }

  const service = inject(ContactsCrudService);
  return firstValueFrom(service.findOne(id));
};
