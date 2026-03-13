import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ContactsFormPage } from './contacts-form.page';
import { ContactsResourceService, createEmptyContact } from '../../services/contacts-resource.service';
import { stubIonMenuButton } from '@shared/testing/menu-button-test.util';

describe('ContactsFormPage', () => {
  let component: ContactsFormPage;
  let fixture: ComponentFixture<ContactsFormPage>;
  let resourceMock: jasmine.SpyObj<ContactsResourceService> & {
    isEditMode: ReturnType<typeof signal<boolean>>;
  };
  let activatedRouteMock: any;

  beforeEach(async () => {
    stubIonMenuButton(ContactsFormPage);

    resourceMock = Object.assign(
      jasmine.createSpyObj<ContactsResourceService>('ContactsResourceService', [
        'guardar',
        'cancelar',
      ]),
      { isEditMode: signal(false) },
    );
    resourceMock.guardar.and.resolveTo();

    activatedRouteMock = {
      snapshot: {
        data: {},
        paramMap: convertToParamMap({}),
      },
    };

    await TestBed.configureTestingModule({
      imports: [ContactsFormPage],
      providers: [
        provideRouter([]),
        { provide: ContactsResourceService, useValue: resourceMock },
        { provide: (await import('@angular/router')).ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactsFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar contacto resuelto en edición', async () => {
    const resolved = {
      ...createEmptyContact(),
      id: 'c-1',
      name: 'Inmobiliaria',
      email: 'x@test.com',
    };

    activatedRouteMock.snapshot.data = { contact: resolved };
    activatedRouteMock.snapshot.paramMap = convertToParamMap({ id: 'c-1' });

    fixture = TestBed.createComponent(ContactsFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.form.get('name')?.value).toBe('Inmobiliaria');
    expect(component.submitLabel()).toBe('Guardar cambios');
  });

  it('debería conservar el id al guardar en modo edición', async () => {
    const resolved = {
      ...createEmptyContact(),
      id: 'c-77',
      name: 'Inmobiliaria',
      email: 'x@test.com',
    };

    activatedRouteMock.snapshot.data = { contact: resolved };
    activatedRouteMock.snapshot.paramMap = convertToParamMap({ id: 'c-77' });

    fixture = TestBed.createComponent(ContactsFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.form.patchValue({
      name: 'Inmobiliaria actualizada',
      email: 'editado@test.com',
    });

    await component.guardar();

    expect(resourceMock.guardar).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 'c-77',
        name: 'Inmobiliaria actualizada',
        email: 'editado@test.com',
      }),
    );
  });

  it('debería mostrar error inline si falla el guardado', async () => {
    resourceMock.guardar.and.rejectWith(
      new HttpErrorResponse({
        status: 400,
        error: { message: 'Datos inválidos.' },
      }),
    );
    component.form.patchValue({
      name: 'Contacto nuevo',
    });

    await component.guardar();
    fixture.detectChanges();

    expect(component.submitError()).toBe('Datos inválidos.');
    expect(fixture.nativeElement.textContent).toContain('No pudimos crear el contacto');
  });
});
