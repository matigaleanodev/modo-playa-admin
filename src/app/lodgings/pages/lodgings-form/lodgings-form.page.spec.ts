import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { LodgingsFormPage } from './lodgings-form.page';
import { LodgingsResourceService } from '@lodgings/services/lodgings-resource.service';
import { ContactsCrudService } from '../../../contacs/services/contacts-crud.service';
import { createEmptyLodging } from '@lodgings/models/lodging.model';

describe('LodgingsFormPage', () => {
  let component: LodgingsFormPage;
  let fixture: ComponentFixture<LodgingsFormPage>;
  let resourceMock: jasmine.SpyObj<LodgingsResourceService> & {
    isEditMode: ReturnType<typeof signal<boolean>>;
    current: ReturnType<typeof signal<any>>;
  };
  let contactsCrudMock: jasmine.SpyObj<ContactsCrudService>;
  let activatedRouteMock: any;

  beforeEach(async () => {
    resourceMock = Object.assign(
      jasmine.createSpyObj<LodgingsResourceService>('LodgingsResourceService', [
        'guardar',
        'cancelar',
        'setCurrent',
        'resetCurrent',
      ]),
      { isEditMode: signal(false), current: signal(null) },
    );
    resourceMock.guardar.and.resolveTo();

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

    activatedRouteMock = {
      snapshot: {
        data: {},
        paramMap: convertToParamMap({}),
      },
    };

    await TestBed.configureTestingModule({
      imports: [LodgingsFormPage],
      providers: [
        provideRouter([]),
        { provide: LodgingsResourceService, useValue: resourceMock },
        { provide: ContactsCrudService, useValue: contactsCrudMock },
        { provide: (await import('@angular/router')).ActivatedRoute, useValue: activatedRouteMock },
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
    activatedRouteMock.snapshot.paramMap = convertToParamMap({ id: 'lod-1' });

    fixture = TestBed.createComponent(LodgingsFormPage);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();

    expect(resourceMock.setCurrent).toHaveBeenCalledWith(resolved);
    expect(component.form.get('contactId')?.value).toBe('c-2');
  });
});
