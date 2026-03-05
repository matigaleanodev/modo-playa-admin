import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiListResponse } from '@core/models/api-response.model';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { Contact } from '../models/contact.model';
import { ContactsCrudService } from './contacts-crud.service';
import {
  ContactsResourceService,
  createEmptyContact,
} from './contacts-resource.service';

describe('ContactsResourceService', () => {
  let service: ContactsResourceService;
  let crudMock: jasmine.SpyObj<ContactsCrudService>;
  let navMock: jasmine.SpyObj<NavService>;
  let toastrMock: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    crudMock = jasmine.createSpyObj<ContactsCrudService>('ContactsCrudService', [
      'find',
      'save',
      'update',
      'delete',
    ]);
    navMock = jasmine.createSpyObj<NavService>('NavService', ['forward', 'root']);
    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', ['success']);
    toastrMock.success.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        ContactsResourceService,
        { provide: ContactsCrudService, useValue: crudMock },
        { provide: NavService, useValue: navMock },
        { provide: ToastrService, useValue: toastrMock },
      ],
    });

    service = TestBed.inject(ContactsResourceService);
  });

  it('debería crear contacto con payload normalizado', async () => {
    const created: Contact = {
      ...createEmptyContact(),
      id: 'c1',
      name: 'Inmo',
      email: 'contacto@test.com',
    };

    crudMock.save.and.returnValue(of(created));
    crudMock.find.and.returnValue(of(buildListResponse([created])));

    await service.guardar({
      id: '',
      name: '  Inmo  ',
      email: ' CONTACTO@TEST.COM ',
      whatsapp: '  +54911  ',
      notes: ' nota ',
      isDefault: 1 as unknown as boolean,
    });

    expect(crudMock.save).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: 'Inmo',
        email: 'contacto@test.com',
        whatsapp: '+54911',
        notes: 'nota',
        isDefault: true,
      }),
    );
    const savePayload = crudMock.save.calls.mostRecent().args[0] as Record<
      string,
      unknown
    >;
    expect(savePayload['id']).toBeUndefined();
    expect(navMock.root).toHaveBeenCalledWith('/app/contacts');
  });

  it('debería actualizar contacto cuando llega id', async () => {
    const updated: Contact = {
      ...createEmptyContact(),
      id: 'c2',
      name: 'Nuevo nombre',
    };

    crudMock.update.and.returnValue(of(updated));
    crudMock.find.and.returnValue(of(buildListResponse([updated])));

    await service.guardar({
      id: ' c2 ',
      name: ' Nuevo nombre ',
      email: '',
      whatsapp: '',
      notes: '',
      isDefault: false,
    });

    expect(crudMock.update).toHaveBeenCalledWith(
      'c2',
      jasmine.objectContaining({ name: 'Nuevo nombre' }),
    );
    expect(toastrMock.success).toHaveBeenCalled();
  });

  it('debería navegar con acciones de UI', () => {
    service.newElement();
    expect(navMock.forward).toHaveBeenCalledWith('/app/contacts/new');

    service.editElement({ ...createEmptyContact(), id: 'c9', name: 'X' });
    expect(navMock.forward).toHaveBeenCalledWith('/app/contacts/c9');

    service.cancelar();
    expect(navMock.root).toHaveBeenCalledWith('/app/contacts');
  });
});

function buildListResponse<T>(data: T[]): ApiListResponse<T> {
  return {
    data,
    total: data.length,
    page: 1,
    limit: 10,
  };
}
