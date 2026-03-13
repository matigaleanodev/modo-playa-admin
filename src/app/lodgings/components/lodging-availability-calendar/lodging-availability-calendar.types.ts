export type CalendarDayState = 'available' | 'occupied' | 'past';

export interface NormalizedAvailabilityRange {
  from: string;
  to: string;
}

export interface AvailabilityCalendarSelection {
  from: string | null;
  to: string | null;
}

export interface CalendarPlaceholderCell {
  readonly id: string;
  readonly isPlaceholder: true;
}

export interface CalendarDayCell {
  readonly id: string;
  readonly isPlaceholder: false;
  readonly dayNumber: number;
  readonly isoDate: string;
  readonly state: CalendarDayState;
  readonly classes: readonly string[];
  readonly ariaLabel: string;
  readonly interactive: boolean;
}

export type CalendarCell = CalendarPlaceholderCell | CalendarDayCell;
