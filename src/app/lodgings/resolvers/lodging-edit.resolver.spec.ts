import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { LodgingsCrudService } from '@lodgings/services/lodgings-crud.service';
import { lodgingEditResolver } from './lodging-edit.resolver';

describe('lodgingEditResolver', () => {
  let crudMock: jasmine.SpyObj<LodgingsCrudService>;

  beforeEach(() => {
    crudMock = jasmine.createSpyObj<LodgingsCrudService>('LodgingsCrudService', ['findOne']);

    TestBed.configureTestingModule({
      providers: [{ provide: LodgingsCrudService, useValue: crudMock }],
    });
  });

  it('debería resolver el alojamiento por id', async () => {
    const lodging = { id: 'lod-1', title: 'Casa' } as any;
    crudMock.findOne.and.returnValue(of(lodging));

    const result = await TestBed.runInInjectionContext(() =>
      lodgingEditResolver(
        { paramMap: convertToParamMap({ id: 'lod-1' }) } as any,
        {} as any,
      ),
    );

    expect(crudMock.findOne).toHaveBeenCalledWith('lod-1');
    expect(result).toEqual(lodging);
  });

  it('debería fallar si no existe id en la ruta', async () => {
    await expectAsync(
      TestBed.runInInjectionContext(() =>
        lodgingEditResolver(
          { paramMap: convertToParamMap({}) } as any,
          {} as any,
        ),
      ),
    ).toBeRejectedWithError(/id/i);
  });
});
