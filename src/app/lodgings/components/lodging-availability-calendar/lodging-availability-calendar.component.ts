import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { AvailabilityRange } from '@lodgings/models/lodging.model';
import {
  AvailabilityCalendarSelection,
  CalendarCell,
  CalendarDayCell,
  CalendarDayState,
  NormalizedAvailabilityRange,
} from './lodging-availability-calendar.types';

@Component({
  selector: 'app-lodging-availability-calendar',
  standalone: true,
  templateUrl: './lodging-availability-calendar.component.html',
  styleUrl: './lodging-availability-calendar.component.scss',
  imports: [CommonModule, IonButton, IonIcon],
})
export class LodgingAvailabilityCalendarComponent {
  private readonly monthLabelFormatter = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  });

  readonly occupiedRanges = input<AvailabilityRange[] | null | undefined>([]);
  readonly selection = input<AvailabilityCalendarSelection | null>({
    from: null,
    to: null,
  });
  readonly selectable = input(false);
  readonly disablePast = input(true);
  readonly weekdayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  readonly currentMonth = signal(this.startOfMonth(new Date()));

  readonly selectionChange = output<AvailabilityCalendarSelection>();
  readonly selectionRejected = output<string>();

  readonly monthLabel = computed(() => {
    const parts = this.monthLabelFormatter.formatToParts(this.currentMonth());
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const year = parts.find((part) => part.type === 'year')?.value ?? '';
    const normalizedMonth =
      month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();

    return `${normalizedMonth} ${year}`.trim();
  });

  readonly normalizedRanges = computed<NormalizedAvailabilityRange[]>(() =>
    (this.occupiedRanges() ?? [])
      .map((range) => this.normalizeRange(range))
      .filter(
        (range): range is NormalizedAvailabilityRange => range !== null,
      )
      .sort((left, right) => left.from.localeCompare(right.from)),
  );

  readonly normalizedSelection = computed<AvailabilityCalendarSelection>(() => {
    const current = this.selection();
    const from = current?.from?.trim() ?? null;
    const to = current?.to?.trim() ?? null;

    return {
      from: this.isIsoDate(from ?? '') ? from : null,
      to: this.isIsoDate(to ?? '') ? to : null,
    };
  });

  readonly calendarCells = computed<CalendarCell[]>(() => {
    const monthStart = this.currentMonth();
    const totalDays = this.daysInMonth(monthStart);
    const startOffset = this.getSundayBasedWeekday(monthStart);
    const todayKey = this.toDateKey(new Date());
    const ranges = this.normalizedRanges();
    const selection = this.normalizedSelection();
    const cells: CalendarCell[] = [];

    for (let index = 0; index < startOffset; index += 1) {
      cells.push({
        id: `placeholder-${monthStart.getFullYear()}-${monthStart.getMonth()}-${index}`,
        isPlaceholder: true,
      });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = this.createLocalDate(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        day,
      );
      const isoDate = this.toDateKey(date);
      const range = this.findRangeForDate(isoDate, ranges);
      const isPast = this.disablePast() && isoDate < todayKey;
      const state: CalendarDayState = isPast
        ? 'past'
        : range
          ? 'occupied'
          : 'available';
      const classes = this.buildClasses(isoDate, state, range, selection);

      cells.push({
        id: isoDate,
        isPlaceholder: false,
        dayNumber: day,
        isoDate,
        state,
        classes,
        ariaLabel: this.buildAriaLabel(day, state, isoDate, selection),
        interactive:
          this.selectable() && state === 'available',
      });
    }

    return cells;
  });

  constructor() {
    addIcons({
      chevronBackOutline,
      chevronForwardOutline,
    });
  }

  showPreviousMonth(): void {
    const month = this.currentMonth();
    this.currentMonth.set(
      this.createLocalDate(month.getFullYear(), month.getMonth() - 1, 1),
    );
  }

  showNextMonth(): void {
    const month = this.currentMonth();
    this.currentMonth.set(
      this.createLocalDate(month.getFullYear(), month.getMonth() + 1, 1),
    );
  }

  onDaySelect(cell: CalendarDayCell): void {
    if (!this.selectable()) {
      return;
    }

    if (cell.state === 'past') {
      this.selectionRejected.emit('No puedes seleccionar fechas pasadas.');
      return;
    }

    if (cell.state === 'occupied') {
      this.selectionRejected.emit(
        'Ese día ya forma parte de un rango ocupado.',
      );
      return;
    }

    const current = this.normalizedSelection();

    if (!current.from || current.to) {
      this.selectionRejected.emit('');
      this.selectionChange.emit({
        from: cell.isoDate,
        to: null,
      });
      return;
    }

    const nextRange =
      cell.isoDate < current.from
        ? { from: cell.isoDate, to: current.from }
        : { from: current.from, to: cell.isoDate };

    if (this.hasOverlap(nextRange.from, nextRange.to)) {
      this.selectionRejected.emit(
        'El rango se superpone con fechas ya ocupadas.',
      );
      return;
    }

    this.selectionRejected.emit('');
    this.selectionChange.emit(nextRange);
  }

  private buildClasses(
    isoDate: string,
    state: CalendarDayState,
    range: NormalizedAvailabilityRange | undefined,
    selection: AvailabilityCalendarSelection,
  ): string[] {
    const classes = [`calendar-day--${state}`];

    if (state === 'occupied' && range) {
      if (isoDate === range.from) {
        classes.push('calendar-day--range-start');
      }

      if (isoDate > range.from && isoDate < range.to) {
        classes.push('calendar-day--range-middle');
      }

      if (isoDate === range.to) {
        classes.push('calendar-day--range-end');
      }
    }

    if (selection.from && !selection.to && isoDate === selection.from) {
      classes.push('calendar-day--selection-start', 'calendar-day--selection-end');
    }

    if (selection.from && selection.to && isoDate >= selection.from && isoDate <= selection.to) {
      if (isoDate === selection.from) {
        classes.push('calendar-day--selection-start');
      } else if (isoDate === selection.to) {
        classes.push('calendar-day--selection-end');
      } else {
        classes.push('calendar-day--selection-middle');
      }
    }

    return classes;
  }

  private normalizeRange(
    range: AvailabilityRange | null | undefined,
  ): NormalizedAvailabilityRange | null {
    if (!range?.from || !range?.to) {
      return null;
    }

    const from = range.from.trim();
    const to = range.to.trim();

    if (!this.isIsoDate(from) || !this.isIsoDate(to) || from > to) {
      return null;
    }

    return { from, to };
  }

  private hasOverlap(from: string, to: string): boolean {
    return this.normalizedRanges().some(
      (range) => !(to < range.from || from > range.to),
    );
  }

  private findRangeForDate(
    isoDate: string,
    ranges: NormalizedAvailabilityRange[],
  ): NormalizedAvailabilityRange | undefined {
    for (const range of ranges) {
      if (isoDate >= range.from && isoDate <= range.to) {
        return range;
      }
    }

    return undefined;
  }

  private buildAriaLabel(
    dayNumber: number,
    state: CalendarDayState,
    isoDate: string,
    selection: AvailabilityCalendarSelection,
  ): string {
    const stateLabels: Record<CalendarDayState, string> = {
      available: 'disponible',
      occupied: 'ocupado',
      past: 'pasado',
    };

    if (
      selection.from &&
      selection.to &&
      isoDate >= selection.from &&
      isoDate <= selection.to
    ) {
      return `${dayNumber}, ${isoDate}, seleccionado`;
    }

    if (selection.from === isoDate && !selection.to) {
      return `${dayNumber}, ${isoDate}, inicio seleccionado`;
    }

    return `${dayNumber}, ${isoDate}, ${stateLabels[state]}`;
  }

  private daysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  private getSundayBasedWeekday(date: Date): number {
    return date.getDay();
  }

  private createLocalDate(year: number, month: number, day: number): Date {
    return new Date(year, month, day, 12, 0, 0, 0);
  }

  private startOfMonth(date: Date): Date {
    return this.createLocalDate(date.getFullYear(), date.getMonth(), 1);
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }
}
