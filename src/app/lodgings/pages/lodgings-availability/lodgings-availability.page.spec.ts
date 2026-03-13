import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { convertToParamMap, provideRouter } from '@angular/router';
import { LodgingsAvailabilityPage } from './lodgings-availability.page';
import { LodgingAvailabilityAdminService } from '@lodgings/services/lodging-availability-admin.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { NavService } from '@shared/services/nav/nav.service';

describe('LodgingsAvailabilityPage', () => {
  let component: LodgingsAvailabilityPage;
  let fixture: ComponentFixture<LodgingsAvailabilityPage>;
  let availabilityMock: jasmine.SpyObj<LodgingAvailabilityAdminService>;

  beforeEach(async () => {
    availabilityMock = jasmine.createSpyObj<LodgingAvailabilityAdminService>(
      'LodgingAvailabilityAdminService',
      ['getOccupiedRanges', 'addOccupiedRange', 'removeOccupiedRange'],
    );
    availabilityMock.getOccupiedRanges.and.resolveTo([
      { from: '2026-01-10', to: '2026-01-11' },
    ]);
    availabilityMock.addOccupiedRange.and.resolveTo([
      { from: '2026-01-10', to: '2026-01-11' },
      { from: '2026-01-20', to: '2026-01-22' },
    ]);
    availabilityMock.removeOccupiedRange.and.resolveTo([]);

    const activatedRouteMock = {
      snapshot: {
        data: { lodging: { id: 'lod-1', title: 'Casa Azul' } },
        paramMap: convertToParamMap({ id: 'lod-1' }),
      },
    };

    await TestBed.configureTestingModule({
      imports: [LodgingsAvailabilityPage],
      providers: [
        provideRouter([]),
        { provide: LodgingAvailabilityAdminService, useValue: availabilityMock },
        {
          provide: ToastrService,
          useValue: jasmine.createSpyObj<ToastrService>('ToastrService', [
            'success',
            'warning',
          ]),
        },
        {
          provide: NavService,
          useValue: jasmine.createSpyObj<NavService>('NavService', ['forward']),
        },
        { provide: (await import('@angular/router')).ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LodgingsAvailabilityPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('debería renderizar rangos ocupados', () => {
    expect(availabilityMock.getOccupiedRanges).toHaveBeenCalledWith('lod-1');
    expect(fixture.nativeElement.textContent).toContain('10/01/2026');
    expect(fixture.nativeElement.textContent).toContain('11/01/2026');
  });

  it('debería agregar rango con éxito', async () => {
    component.form.setValue({ from: '2026-01-20', to: '2026-01-22' });

    await component.onAddRange();
    fixture.detectChanges();

    expect(availabilityMock.addOccupiedRange).toHaveBeenCalledWith('lod-1', {
      from: '2026-01-20',
      to: '2026-01-22',
    });
    expect(component.ranges().length).toBe(2);
    expect(component.form.value.from).toBe('');
    expect(component.form.value.to).toBe('');
    expect(component.statusMessage()).toBe('Rango ocupado agregado correctamente.');
  });

  it('debería mostrar error de solapamiento', async () => {
    availabilityMock.addOccupiedRange.and.rejectWith(
      new HttpErrorResponse({
        status: 400,
        error: { code: 'OCCUPIED_RANGE_CONFLICT' },
      }),
    );
    component.form.setValue({ from: '2026-01-11', to: '2026-01-13' });

    await component.onAddRange();

    expect(component.formError()).toBe('El rango se superpone con otro ya cargado.');
  });

  it('debería eliminar rango con éxito', async () => {
    await component.onRemoveRange({ from: '2026-01-10', to: '2026-01-11' });

    expect(availabilityMock.removeOccupiedRange).toHaveBeenCalledWith('lod-1', {
      from: '2026-01-10',
      to: '2026-01-11',
    });
    expect(component.ranges()).toEqual([]);
    expect(component.statusMessage()).toBe('Rango ocupado eliminado correctamente.');
  });
});
