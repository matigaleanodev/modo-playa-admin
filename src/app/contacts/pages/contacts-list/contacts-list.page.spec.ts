import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ContactsListPage } from './contacts-list.page';
import { ContactsResourceService } from '../../services/contacts-resource.service';
import { DialogService } from '@shared/services/dialog/dialog.service';
import { stubIonMenuButton } from '@shared/testing/menu-button-test.util';

describe('ContactsListPage', () => {
  let component: ContactsListPage;
  let fixture: ComponentFixture<ContactsListPage>;
  let resourceMock: ReturnType<typeof createResourceMock>;
  let dialogMock: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    stubIonMenuButton(ContactsListPage);

    resourceMock = createResourceMock();
    dialogMock = jasmine.createSpyObj<DialogService>('DialogService', ['confirm']);
    dialogMock.confirm.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [ContactsListPage],
      providers: [
        { provide: ContactsResourceService, useValue: resourceMock },
        {
          provide: DialogService,
          useValue: dialogMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactsListPage);
    component = fixture.componentInstance;
  });

  it('debería cargar la primera página si la lista está vacía', async () => {
    await component.ngOnInit();

    expect(resourceMock.loadPage).toHaveBeenCalled();
  });

  it('no debería cargar si ya existen items', async () => {
    resourceMock.items.set([{ id: 'c1' } as any]);

    await component.ngOnInit();

    expect(resourceMock.loadPage).not.toHaveBeenCalled();
  });

  it('debería delegar acciones de paginado al resource', async () => {
    await component.onRefresh();
    await component.onPageChange(3);
    await component.onLimitChange(50);

    expect(resourceMock.refresh).toHaveBeenCalled();
    expect(resourceMock.setPage).toHaveBeenCalledWith(3);
    expect(resourceMock.setLimit).toHaveBeenCalledWith(50);
  });

  it('debería pedir confirmación con el nombre del contacto antes de eliminar', async () => {
    await component.onDelete({ id: 'c1', name: 'Inmobiliaria Norte' } as any);

    expect(dialogMock.confirm).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Eliminar elemento',
        itemLabel: 'Inmobiliaria Norte',
        confirmLabel: 'Eliminar',
        color: 'danger',
        showIcon: true,
      }),
    );
    expect(resourceMock.delete).toHaveBeenCalled();
  });
});

function createResourceMock() {
  return {
    items: signal<any[]>([]),
    loading: signal(false),
    error: signal<string | null>(null),
    page: signal(1),
    limit: signal(10),
    total: signal(0),
    loadPage: jasmine.createSpy('loadPage').and.resolveTo(undefined),
    refresh: jasmine.createSpy('refresh').and.resolveTo(undefined),
    setPage: jasmine.createSpy('setPage').and.resolveTo(undefined),
    setLimit: jasmine.createSpy('setLimit').and.resolveTo(undefined),
    editElement: jasmine.createSpy('editElement'),
    newElement: jasmine.createSpy('newElement'),
    delete: jasmine.createSpy('delete').and.resolveTo(undefined),
  };
}
