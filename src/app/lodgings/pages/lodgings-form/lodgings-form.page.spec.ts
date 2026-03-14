import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { LodgingsFormPage } from './lodgings-form.page';
import { LodgingsResourceService } from '@lodgings/services/lodgings-resource.service';
import { LodgingsCrudService } from '@lodgings/services/lodgings-crud.service';
import { LodgingImagesAdminService } from '@lodgings/services/lodging-images-admin.service';
import { ContactsCrudService } from '@contacts/services/contacts-crud.service';
import { createEmptyLodging, Lodging } from '@lodgings/models/lodging.model';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { NavService } from '@shared/services/nav/nav.service';
import { stubIonMenuButton } from '@shared/testing/menu-button-test.util';

describe('LodgingsFormPage', () => {
  let component: LodgingsFormPage;
  let fixture: ComponentFixture<LodgingsFormPage>;
  let resourceMock: jasmine.SpyObj<LodgingsResourceService> & {
    isEditMode: ReturnType<typeof signal<boolean>>;
    current: ReturnType<typeof signal<Lodging | null>>;
  };
  let contactsCrudMock: jasmine.SpyObj<ContactsCrudService>;
  let lodgingsCrudMock: jasmine.SpyObj<LodgingsCrudService>;
  let lodgingImagesMock: jasmine.SpyObj<LodgingImagesAdminService>;
  let toastrMock: jasmine.SpyObj<ToastrService>;
  let navMock: jasmine.SpyObj<NavService>;
  let activatedRouteMock: ActivatedRoute;

  beforeEach(async () => {
    stubIonMenuButton(LodgingsFormPage);

    resourceMock = Object.assign(
      jasmine.createSpyObj<LodgingsResourceService>('LodgingsResourceService', [
        'guardar',
        'cancelar',
        'refresh',
        'setCurrent',
        'resetCurrent',
        'normalizePayloadForSave',
      ]),
      { isEditMode: signal(false), current: signal(null) },
    );
    resourceMock.guardar.and.resolveTo();
    resourceMock.normalizePayloadForSave.and.callFake((payload) => payload);

    contactsCrudMock = jasmine.createSpyObj<ContactsCrudService>('ContactsCrudService', [
      'find',
    ]);
    contactsCrudMock.find.and.returnValue(
      of({
        data: [
          { id: 'c-default', name: 'Predeterminado', isDefault: true },
          { id: 'c-2', name: 'Otro', isDefault: false },
        ],
        total: 2,
        page: 1,
        limit: 50,
      }),
    );

    lodgingsCrudMock = jasmine.createSpyObj<LodgingsCrudService>('LodgingsCrudService', [
      'save',
      'update',
    ]);
    lodgingImagesMock = jasmine.createSpyObj<LodgingImagesAdminService>(
      'LodgingImagesAdminService',
      ['setDefaultImage', 'deleteImage', 'uploadDraftImage', 'uploadImage'],
    );
    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', [
      'success',
      'warning',
      'danger',
    ]);
    navMock = jasmine.createSpyObj<NavService>('NavService', ['forward', 'root']);
    resourceMock.refresh.and.resolveTo();

    activatedRouteMock = {
      snapshot: {
        data: {},
        paramMap: convertToParamMap({}),
      },
    } as ActivatedRoute;

    await TestBed.configureTestingModule({
      imports: [LodgingsFormPage],
      providers: [
        provideRouter([]),
        { provide: LodgingsResourceService, useValue: resourceMock },
        { provide: ContactsCrudService, useValue: contactsCrudMock },
        { provide: LodgingsCrudService, useValue: lodgingsCrudMock },
        { provide: LodgingImagesAdminService, useValue: lodgingImagesMock },
        { provide: ToastrService, useValue: toastrMock },
        { provide: NavService, useValue: navMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LodgingsFormPage);
    component = fixture.componentInstance;
  });

  it('debería crearse correctamente', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('debería autoseleccionar contacto predeterminado en alta', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.form.get('contactId')?.value).toBe('c-default');
    const contactField = component.fields.find((field) => field.key === 'contactId');
    expect(contactField?.options?.length).toBe(2);
  });

  it('no debería autoseleccionar contacto en edición y debe cargar resolver', async () => {
    const resolved = {
      ...createEmptyLodging(),
      id: 'lod-1',
      title: 'Lodging',
      contactId: 'c-2',
    };
    activatedRouteMock.snapshot.data = { lodging: resolved };
    (activatedRouteMock.snapshot as { paramMap: ReturnType<typeof convertToParamMap> }).paramMap =
      convertToParamMap({ id: 'lod-1' });

    fixture = TestBed.createComponent(LodgingsFormPage);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();

    expect(resourceMock.setCurrent).toHaveBeenCalledWith(resolved);
    expect(component.form.get('contactId')?.value).toBe('c-2');
  });

  it('debería crear un lodging con pendingImageIds ordenados por la imagen predeterminada', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const created: Lodging = {
      ...createEmptyLodging(),
      id: 'lod-1',
      mediaImages: [
        {
          imageId: 'img-default',
          key: 'img-default',
          isDefault: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          url: 'https://img/default.webp',
        },
      ],
    };
    lodgingsCrudMock.save.and.returnValue(of(created));

    component.form.setValue({
      title: 'Casa nueva',
      type: 'cabin',
      description: 'Descripcion valida',
      location: 'Calle 1',
      city: 'Mar Azul',
      price: 100,
      priceUnit: 'night',
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      minNights: 2,
      contactId: 'c-default',
      distanceToBeach: null,
      amenities: [],
      active: true,
    });
    component.imageItems.set([
      {
        localId: 'img-1',
        source: 'draft',
        imageId: 'img-secondary',
        isDefault: false,
        previewUrl: 'blob:secondary',
        publicUrl: '',
        uploading: false,
        draftStatus: 'confirmed',
        uploadSessionId: 'session-1',
      },
      {
        localId: 'img-2',
        source: 'draft',
        imageId: 'img-default',
        isDefault: true,
        previewUrl: 'blob:default',
        publicUrl: '',
        uploading: false,
        draftStatus: 'confirmed',
        uploadSessionId: 'session-1',
      },
    ]);
    component.draftUploadSessionId.set('session-1');

    expect(component.form.invalid).toBeFalse();

    await component.guardar();

    expect(lodgingsCrudMock.save).toHaveBeenCalledWith(
      jasmine.objectContaining({
        uploadSessionId: 'session-1',
        pendingImageIds: ['img-default', 'img-secondary'],
      }),
    );
    expect(resourceMock.setCurrent).toHaveBeenCalledWith(created);
    expect(navMock.root).toHaveBeenCalledWith('/app/lodgings');
  });

  it('debería mostrar error inline si falla el guardado', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    lodgingsCrudMock.save.and.returnValue(
      new (await import('rxjs')).Observable((subscriber) => {
        subscriber.error(
          new HttpErrorResponse({
            status: 500,
            error: { message: 'Error al guardar alojamiento.' },
          }),
        );
      }),
    );

    component.form.setValue({
      title: 'Casa nueva',
      type: 'cabin',
      description: 'Descripcion valida',
      location: 'Calle 1',
      city: 'Mar Azul',
      price: 100,
      priceUnit: 'night',
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      minNights: 2,
      contactId: 'c-default',
      distanceToBeach: null,
      amenities: [],
      active: true,
    });
    component.imageItems.set([
      {
        localId: 'img-1',
        source: 'draft',
        imageId: 'img-default',
        isDefault: true,
        previewUrl: 'blob:default',
        publicUrl: '',
        uploading: false,
        draftStatus: 'confirmed',
        uploadSessionId: 'session-1',
      },
    ]);
    component.draftUploadSessionId.set('session-1');

    await component.guardar();
    fixture.detectChanges();

    expect(component.submitError()).toBe('Error al guardar alojamiento.');
    expect(fixture.nativeElement.textContent).toContain('No pudimos crear el alojamiento');
  });

  it('debería mostrar advertencia inline si falla la carga de contactos', async () => {
    contactsCrudMock.find.and.returnValue(
      new (await import('rxjs')).Observable((subscriber) => {
        subscriber.error(new Error('boom'));
      }),
    );

    fixture = TestBed.createComponent(LodgingsFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.contactsLoadError()).toContain('No pudimos cargar los contactos');
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar los contactos');
  });
});
