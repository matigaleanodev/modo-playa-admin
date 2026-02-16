import { ResolveFn } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { CrudService } from '@core/crud/crud.service';
import { BaseEntity } from '@core/models/entity.model';

export function createDetailResolver<T extends BaseEntity>(
  serviceType: new (...args: any[]) => CrudService<T>,
): ResolveFn<T> {
  return (route: ActivatedRouteSnapshot) => {
    const service = inject(serviceType);
    const id = route.paramMap.get('id') as string;
    return service.findOne(id);
  };
}
