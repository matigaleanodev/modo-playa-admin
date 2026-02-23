import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Lodging } from '@lodgings/models/lodging.model';
import { LodgingsCrudService } from '@lodgings/services/lodgings-crud.service';

export const lodgingEditResolver: ResolveFn<Lodging> = async (route) => {
  const id = route.paramMap.get('id');

  if (!id) {
    throw new Error('Parametro "id" requerido para editar alojamiento.');
  }

  const service = inject(LodgingsCrudService);
  return firstValueFrom(service.findOne(id));
};
