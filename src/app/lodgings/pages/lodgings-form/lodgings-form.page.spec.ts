import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { LodgingsFormPage } from './lodgings-form.page';
import { LodgingsResourceService } from '@lodgings/services/lodgings-resource.service';
import { LodgingsCrudService } from '@lodgings/services/lodgings-crud.service';
import { LodgingImagesAdminService } from '@lodgings/services/lodging-images-admin.service';
import { ContactsCrudService } from '../../../contacs/services/contacts-crud.service';
import { createEmptyLodging, Lodging } from '@lodgings/models/lodging.model';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { NavService } from '@shared/services/nav/nav.service';

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
    resourceMock = Object.assign(
      jasmine.createSpyObj<LodgingsResourceService>('LodgingsResourceService', [
        'guardar',
        'cancelar',
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
      'createWithImages',
      'updateWithImages',
    ]);
    lodgingImagesMock = jasmine.createSpyObj<LodgingImagesAdminService>(
      'LodgingImagesAdminService',
      ['setDefaultImage', 'deleteImage'],
    );
    toastrMock = jasmine.createSpyObj<ToastrService>('ToastrService', [
      'success',
      'warning',
      'danger',
    ]);
    navMock = jasmine.createSpyObj<NavService>('NavService', ['forward', 'root']);

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

  it('debería resolver imageId de imagen predeterminada encolada usando estado previo', () => {
    const queuedBeforeSave = [
      {
        localId: 'queued-a',
        source: 'queued',
        isDefault: false,
        previewUrl: 'blob:a',
        publicUrl: '',
      },
      {
        localId: 'queued-b',
        source: 'queued',
        isDefault: true,
        previewUrl: 'blob:b',
        publicUrl: '',
      },
    ];
    const selectedDefaultBeforeSave = queuedBeforeSave[1];
    const updated: Lodging = {
      ...createEmptyLodging(),
      id: 'lod_1',
      mediaImages: [
        {
          imageId: 'img-existing',
          key: 'existing',
          isDefault: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          url: 'https://img/existing.jpg',
        },
        {
          imageId: 'img-new-1',
          key: 'new-1',
          isDefault: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          url: 'https://img/new-1.jpg',
        },
        {
          imageId: 'img-new-2',
          key: 'new-2',
          isDefault: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          url: 'https://img/new-2.jpg',
        },
      ],
    };

    const resolvedImageId = (
      component as unknown as {
        resolveQueuedDefaultImageId: (
          selected: {
            localId: string;
            source: string;
          } | null,
          lodging: Lodging,
          existing: Set<string>,
          queuedItems: Array<{ localId: string }>,
        ) => string | null;
      }
    ).resolveQueuedDefaultImageId(
      selectedDefaultBeforeSave,
      updated,
      new Set(['img-existing']),
      queuedBeforeSave,
    );

    expect(resolvedImageId).toBe('img-new-2');
  });
});
