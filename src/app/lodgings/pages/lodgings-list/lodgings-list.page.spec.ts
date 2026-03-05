import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LodgingsListPage } from './lodgings-list.page';
import { LodgingsResourceService } from '@lodgings/services/lodgings-resource.service';
import { DialogService } from '@shared/services/dialog/dialog.service';

describe('LodgingsListPage', () => {
  let component: LodgingsListPage;
  let fixture: ComponentFixture<LodgingsListPage>;
  let resourceMock: ReturnType<typeof createResourceMock>;

  beforeEach(async () => {
    resourceMock = createResourceMock();

    await TestBed.configureTestingModule({
      imports: [LodgingsListPage],
      providers: [
        { provide: LodgingsResourceService, useValue: resourceMock },
        {
          provide: DialogService,
          useValue: jasmine.createSpyObj<DialogService>('DialogService', ['confirm']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LodgingsListPage);
    component = fixture.componentInstance;
  });

  it('debería cargar la primera página si no hay items', async () => {
    await component.ngOnInit();

    expect(resourceMock.loadPage).toHaveBeenCalled();
  });

  it('no debería cargar si ya hay items en resource', async () => {
    resourceMock.items.set([{ id: 'l1' } as any]);

    await component.ngOnInit();

    expect(resourceMock.loadPage).not.toHaveBeenCalled();
  });

  it('debería delegar refresh, page y limit al resource', async () => {
    await component.onRefresh();
    await component.onPageChange(2);
    await component.onLimitChange(20);

    expect(resourceMock.refresh).toHaveBeenCalled();
    expect(resourceMock.setPage).toHaveBeenCalledWith(2);
    expect(resourceMock.setLimit).toHaveBeenCalledWith(20);
  });

  it('debería abrir disponibilidad del alojamiento', () => {
    component.openAvailability({ id: 'lod-1' } as any);
    expect(resourceMock.openAvailability).toHaveBeenCalledWith({ id: 'lod-1' } as any);
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
    openAvailability: jasmine.createSpy('openAvailability'),
    newElement: jasmine.createSpy('newElement'),
    delete: jasmine.createSpy('delete').and.resolveTo(undefined),
  };
}
