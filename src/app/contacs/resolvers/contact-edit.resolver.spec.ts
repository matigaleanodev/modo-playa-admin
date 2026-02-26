import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ContactsCrudService } from '../services/contacts-crud.service';
import { contactEditResolver } from './contact-edit.resolver';

describe('contactEditResolver', () => {
  let crudMock: jasmine.SpyObj<ContactsCrudService>;

  beforeEach(() => {
    crudMock = jasmine.createSpyObj<ContactsCrudService>('ContactsCrudService', ['findOne']);

    TestBed.configureTestingModule({
      providers: [{ provide: ContactsCrudService, useValue: crudMock }],
    });
  });

  it('debería resolver el contacto por id', async () => {
    const contact = { id: 'c-1', name: 'Contacto' } as any;
    crudMock.findOne.and.returnValue(of(contact));

    const result = await TestBed.runInInjectionContext(() =>
      contactEditResolver(
        { paramMap: convertToParamMap({ id: 'c-1' }) } as any,
        {} as any,
      ),
    );

    expect(crudMock.findOne).toHaveBeenCalledWith('c-1');
    expect(result).toEqual(contact);
  });

  it('debería fallar si no llega id en la ruta', async () => {
    await expectAsync(
      TestBed.runInInjectionContext(() =>
        contactEditResolver(
          { paramMap: convertToParamMap({}) } as any,
          {} as any,
        ),
      ),
    ).toBeRejectedWithError(/id/i);
  });
});
