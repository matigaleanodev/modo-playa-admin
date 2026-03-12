import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ERROR_MESSAGES } from '@core/constants/error-message';
import { LodgingsResourceService } from './lodgings-resource.service';
import { LodgingsCrudService } from './lodgings-crud.service';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { ApiListResponse } from '@core/models/api-response.model';
import {
  Lodging,
  LodgingSaveDto,
  createEmptyLodging,
} from '@lodgings/models/lodging.model';

describe('LodgingsResourceService', () => {
  let service: LodgingsResourceService;
  let crudMock: jasmine.SpyObj<LodgingsCrudService>;
  let navMock: jasmine.SpyObj<NavService>;
  let toastrMock: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    crudMock = jasmine.createSpyObj<LodgingsCrudService>('LodgingsCrudService', [
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
        LodgingsResourceService,
        { provide: LodgingsCrudService, useValue: crudMock },
        { provide: NavService, useValue: navMock },
        { provide: ToastrService, useValue: toastrMock },
      ],
    });

    service = TestBed.inject(LodgingsResourceService);
  });

  it('debería crear alojamiento, normalizar payload y refrescar lista', async () => {
    const created: Lodging = {
      ...createEmptyLodging(),
      id: 'lod_1',
      title: 'Casa Azul',
      city: 'Mar Azul',
      location: 'Calle 1',
      description: 'Desc',
      mainImage: 'https://img.test/x.jpg',
      price: 100,
      priceUnit: 'night',
      type: 'house',
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      minNights: 2,
      amenities: ['wifi'],
      active: true,
    };

    crudMock.save.and.returnValue(of(created));
    crudMock.find.and.returnValue(of(buildListResponse([created])));

    const newPayload: LodgingSaveDto & { id?: string } = {
      ...createEmptyLodging(),
      title: '  Casa Azul  ',
      city: '  Mar Azul ',
      location: '  Calle 1 ',
      description: ' Desc ',
      mainImage: ' https://img.test/x.jpg ',
      price: '100' as unknown as number,
      priceUnit: 'night',
      type: 'house',
      maxGuests: '4.7' as unknown as number,
      bedrooms: '2.2' as unknown as number,
      bathrooms: '1.8' as unknown as number,
      minNights: '2.9' as unknown as number,
      distanceToBeach: '350' as unknown as number,
      amenities: ['wifi', '' as unknown as any],
      images: ['  a.jpg ', '  '],
      contactId: '  cont_1 ',
      active: 1 as unknown as boolean,
    };

    delete (newPayload as Partial<Lodging>).id;

    await service.guardar(newPayload);

    expect(crudMock.save).toHaveBeenCalled();
    const payload = crudMock.save.calls.mostRecent().args[0] as Partial<Lodging>;
    expect(payload.title).toBe('Casa Azul');
    expect(payload.city).toBe('Mar Azul');
    expect(payload.location).toBe('Calle 1');
    expect(payload.mainImage).toBe('https://img.test/x.jpg');
    expect(payload.maxGuests).toBe(4);
    expect(payload.bedrooms).toBe(2);
    expect(payload.bathrooms).toBe(1);
    expect(payload.minNights).toBe(2);
    expect(payload.distanceToBeach).toBe(350);
    expect(payload.images).toEqual(['a.jpg']);
    expect(payload).not.toEqual(jasmine.objectContaining({ occupiedRanges: jasmine.anything() }));
    expect(payload.contactId).toBe('cont_1');
    expect(payload.active).toBeTrue();

    expect(crudMock.find).toHaveBeenCalled();
    expect(navMock.root).toHaveBeenCalledWith('/app/lodgings');
    expect(toastrMock.success).toHaveBeenCalledWith(
      'Alojamiento creado correctamente.',
      'Alta completada',
    );
  });

  it('debería actualizar alojamiento en modo edición', async () => {
    const current: Lodging = {
      ...createEmptyLodging(),
      id: 'lod_2',
      title: 'Actual',
      city: 'Mar de las Pampas',
      location: 'Av. 1',
      description: 'Desc',
      mainImage: 'https://img/x.jpg',
      price: 100,
      priceUnit: 'week',
      type: 'cabin',
      maxGuests: 6,
      bedrooms: 2,
      bathrooms: 1,
      minNights: 3,
      active: true,
    };
    const updated = { ...current, title: 'Nuevo título' };

    service.setCurrent(current);
    crudMock.update.and.returnValue(of(updated));
    crudMock.find.and.returnValue(of(buildListResponse([updated])));

    await service.guardar({ ...current, title: ' Nuevo título ' });

    expect(crudMock.update).toHaveBeenCalledWith(
      'lod_2',
      jasmine.objectContaining({ title: 'Nuevo título' }),
    );
    expect(toastrMock.success).toHaveBeenCalledWith(
      'Alojamiento actualizado correctamente.',
      'Edición completada',
    );
    expect(service.current()?.title).toBe('Nuevo título');
  });

  it('debería normalizar valores numéricos de texto con coma decimal', () => {
    const normalized = service.normalizePayloadForSave({
      ...createEmptyLodging(),
      title: 'Casa 1',
      description: 'Desc',
      location: 'Calle 1',
      city: 'Mar Azul',
      mainImage: 'https://img.test/1.jpg',
      price: '100,5' as unknown as number,
      maxGuests: '4,9' as unknown as number,
      bedrooms: '2,7' as unknown as number,
      bathrooms: '1,4' as unknown as number,
      minNights: '3,8' as unknown as number,
      distanceToBeach: '250,9' as unknown as number,
      active: true,
    });

    expect(normalized.price).toBe(100.5);
    expect(normalized.maxGuests).toBe(4);
    expect(normalized.bedrooms).toBe(2);
    expect(normalized.bathrooms).toBe(1);
    expect(normalized.minNights).toBe(3);
    expect(normalized.distanceToBeach).toBe(250);
  });

  it('debería aplicar defaults cuando los numéricos no son válidos', () => {
    const normalized = service.normalizePayloadForSave({
      ...createEmptyLodging(),
      title: 'Casa 2',
      description: 'Desc',
      location: 'Calle 2',
      city: 'Las Gaviotas',
      mainImage: 'https://img.test/2.jpg',
      price: 'abc' as unknown as number,
      maxGuests: 'abc' as unknown as number,
      bedrooms: 'abc' as unknown as number,
      bathrooms: 'abc' as unknown as number,
      minNights: 'abc' as unknown as number,
      distanceToBeach: 'abc' as unknown as number,
      active: true,
    });

    expect(normalized.price).toBe(0);
    expect(normalized.maxGuests).toBe(1);
    expect(normalized.bedrooms).toBe(0);
    expect(normalized.bathrooms).toBe(0);
    expect(normalized.minNights).toBe(1);
    expect(normalized.distanceToBeach).toBeNull();
  });

  it('debería navegar en newElement, editElement y availability', () => {
    const lodging = { ...createEmptyLodging(), id: 'lod_9', title: 'X' };

    service.newElement();
    expect(navMock.forward).toHaveBeenCalledWith('/app/lodgings/new');
    expect(service.current()).toBeTruthy();

    service.editElement(lodging);
    expect(navMock.forward).toHaveBeenCalledWith('/app/lodgings/lod_9');
    expect(service.current()?.id).toBe('lod_9');

    service.openAvailability(lodging);
    expect(navMock.forward).toHaveBeenCalledWith('/app/lodgings/lod_9/availability');
  });

  it('debería priorizar LODGING_NOT_FOUND desde error.code al cargar la lista', async () => {
    crudMock.find.and.returnValue(
      new Observable((subscriber) => {
        subscriber.error(
          new HttpErrorResponse({
            status: 404,
            error: { code: 'LODGING_NOT_FOUND', message: 'Alojamiento legacy' },
          }),
        );
      }),
    );

    await expectAsync(service.loadPage()).toBeRejected();
    expect(service.error()).toBe(ERROR_MESSAGES.LODGING_NOT_FOUND);
  });

  it('debería usar fallback genérico ante errores no-http al cargar la lista', async () => {
    crudMock.find.and.returnValue(
      new Observable((subscriber) => {
        subscriber.error(new Error('boom'));
      }),
    );

    await expectAsync(service.loadPage()).toBeRejected();
    expect(service.error()).toBe('Ocurrio un error al cargar los datos.');
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
