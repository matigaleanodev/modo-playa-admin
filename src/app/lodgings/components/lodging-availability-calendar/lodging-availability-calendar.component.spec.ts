import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LodgingAvailabilityCalendarComponent } from './lodging-availability-calendar.component';

describe('LodgingAvailabilityCalendarComponent', () => {
  let component: LodgingAvailabilityCalendarComponent;
  let fixture: ComponentFixture<LodgingAvailabilityCalendarComponent>;

  function isCalendarDayCell(
    cell: (typeof component.calendarCells extends () => infer T ? T : never)[number],
  ): cell is Extract<
    (typeof component.calendarCells extends () => infer T ? T : never)[number],
    { isPlaceholder: false }
  > {
    return !cell.isPlaceholder;
  }

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 2, 10, 12, 0, 0, 0));

    await TestBed.configureTestingModule({
      imports: [LodgingAvailabilityCalendarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LodgingAvailabilityCalendarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('occupiedRanges', [
      { from: '2026-03-06', to: '2026-03-13' },
      { from: '2026-03-16', to: '2026-03-22' },
    ]);
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('deberia crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('deberia marcar dias pasados, ocupados y disponibles con sus clases', () => {
    const cells = component.calendarCells().filter(isCalendarDayCell);
    const dayNine = cells.find((cell) => cell.isoDate === '2026-03-09');
    const dayTen = cells.find((cell) => cell.isoDate === '2026-03-10');
    const dayThirteen = cells.find((cell) => cell.isoDate === '2026-03-13');
    const dayFourteen = cells.find((cell) => cell.isoDate === '2026-03-14');

    expect(dayNine?.classes).toContain('calendar-day--past');
    expect(dayTen?.classes).toContain('calendar-day--occupied');
    expect(dayThirteen?.classes).toContain('calendar-day--range-end');
    expect(dayFourteen?.classes).toEqual(['calendar-day--available']);
  });

  it('deberia emitir una seleccion simple y luego completarla si no hay solapamiento', () => {
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();

    const selectionSpy = jasmine.createSpy('selectionChange');
    const rejectionSpy = jasmine.createSpy('selectionRejected');
    component.selectionChange.subscribe(selectionSpy);
    component.selectionRejected.subscribe(rejectionSpy);

    const cells = component.calendarCells().filter(isCalendarDayCell);
    const dayFourteen = cells.find((cell) => cell.isoDate === '2026-03-14');
    const dayFifteen = cells.find((cell) => cell.isoDate === '2026-03-15');

    component.onDaySelect(dayFourteen!);
    fixture.componentRef.setInput('selection', { from: '2026-03-14', to: null });
    fixture.detectChanges();
    component.onDaySelect(dayFifteen!);

    expect(selectionSpy.calls.allArgs()).toEqual([
      [{ from: '2026-03-14', to: null }],
      [{ from: '2026-03-14', to: '2026-03-15' }],
    ]);
    expect(rejectionSpy.calls.mostRecent().args[0]).toBe('');
  });

  it('deberia rechazar rangos que se superponen con dias ocupados', () => {
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selection', { from: '2026-03-14', to: null });
    fixture.detectChanges();

    const selectionSpy = jasmine.createSpy('selectionChange');
    const rejectionSpy = jasmine.createSpy('selectionRejected');
    component.selectionChange.subscribe(selectionSpy);
    component.selectionRejected.subscribe(rejectionSpy);

    const cells = component.calendarCells().filter(isCalendarDayCell);
    const daySeventeen = cells.find((cell) => cell.isoDate === '2026-03-17');

    component.onDaySelect(daySeventeen!);

    expect(selectionSpy).not.toHaveBeenCalled();
    expect(rejectionSpy).toHaveBeenCalledWith(
      'Ese día ya forma parte de un rango ocupado.',
    );
  });
});
