import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { CrudService } from '@core/crud/crud.service';
import { BaseEntity } from '@core/models/entity.model';

export function createListResolver<T extends BaseEntity>(
  serviceType: new (...args: any[]) => CrudService<T>,
): ResolveFn<T[]> {
  return () => {
    const service = inject(serviceType);
    return service.findAll();
  };
}
