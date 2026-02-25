import { Injectable } from '@angular/core';
import { CrudService } from '@core/crud/crud.service';
import { AdminUser } from '../models/user-admin.model';

@Injectable({
  providedIn: 'root',
})
export class UsersCrudService extends CrudService<AdminUser> {
  constructor() {
    super('admin/users');
  }
}
