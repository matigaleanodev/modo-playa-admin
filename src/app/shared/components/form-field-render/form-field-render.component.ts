import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  FormOption,
  FormOptionChoice,
} from '@core/models/form-option.model';

export interface FormFieldChangeEvent<T = unknown> {
  field: FormOption<T>;
  value: T;
}

export interface FormFieldBlurEvent<T = unknown> {
  field: FormOption<T>;
}

@Component({
  selector: 'app-form-field-render',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-field-render.component.html',
  styleUrls: ['./form-field-render.component.scss'],
})
export class FormFieldRenderComponent {
  readonly form = input.required<FormGroup>();
  readonly fields = input.required<FormOption<unknown>[]>();

  readonly fieldChange = output<FormFieldChangeEvent>();
  readonly fieldBlur = output<FormFieldBlurEvent>();

  trackByFieldKey = (_: number, field: FormOption<unknown>) => field.key;

  getControl(fieldKey: string): FormControl {
    const control = this.form().get(fieldKey);
    if (!(control instanceof FormControl)) {
      throw new Error(
        `El control con key "${fieldKey}" no es un FormControl o no existe.`,
      );
    }

    return control;
  }

  isFieldVisible(field: FormOption<unknown>): boolean {
    if (field.type === 'hidden') return false;
    return !field.hidden;
  }

  getFieldType(field: FormOption<unknown>): string {
    switch (field.type) {
      case 'email':
      case 'password':
      case 'date':
        return field.type;
      case 'number':
        return 'number';
      default:
        return 'text';
    }
  }

  getFieldHelper(field: FormOption<unknown>): string | null {
    return field.hint ?? field.helper ?? null;
  }

  getFieldError(field: FormOption<unknown>): string | null {
    const control = this.getControl(field.key);

    if (!control.invalid || !(control.touched || control.dirty)) {
      return null;
    }

    const errors = field.errores ?? {};
    if (!control.errors) return null;

    for (const errorKey of Object.keys(control.errors)) {
      if (errors[errorKey]) return errors[errorKey];
    }

    return 'Revisa este campo.';
  }

  getFieldOptions(field: FormOption<unknown>): FormOptionChoice<unknown>[] {
    return field.options ?? [];
  }

  getFieldColumns(field: FormOption<unknown>): number {
    const columns = field.columns ?? 12;
    if (!Number.isFinite(columns)) return 12;
    return Math.min(12, Math.max(1, Math.trunc(columns)));
  }

  getMultipleSelectedLabels(field: FormOption<unknown>): string[] {
    if (field.type !== 'multiple') return [];

    const control = this.getControl(field.key);
    const selectedValues = Array.isArray(control.value) ? control.value : [];
    if (!selectedValues.length) return [];

    const labelsByValue = new Map(
      this.getFieldOptions(field).map((option) => [String(option.value), option.label]),
    );

    return selectedValues.map((value) => labelsByValue.get(String(value)) ?? String(value));
  }

  isMultipleOptionSelected(
    field: FormOption<unknown>,
    option: FormOptionChoice<unknown>,
  ): boolean {
    if (field.type !== 'multiple') return false;

    const control = this.getControl(field.key);
    const selectedValues = Array.isArray(control.value) ? control.value : [];

    return selectedValues.some((value) => String(value) === String(option.value));
  }

  onMultipleOptionToggle(
    field: FormOption<unknown>,
    option: FormOptionChoice<unknown>,
    checked: boolean,
  ): void {
    if (field.type !== 'multiple') return;

    const control = this.getControl(field.key);
    const currentValues = Array.isArray(control.value) ? control.value : [];
    const optionValue = String(option.value);
    const nextValues = checked
      ? [
          ...currentValues.filter((value) => String(value) !== optionValue),
          option.value,
        ]
      : currentValues.filter((value) => String(value) !== optionValue);

    control.setValue(nextValues);
    control.markAsDirty();
    this.fieldChange.emit({ field, value: nextValues });
  }

  onInput(field: FormOption<unknown>, event: Event): void {
    const target = event.target as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;

    let value: unknown = target.value;

    if (field.type === 'boolean' && target instanceof HTMLInputElement) {
      value = target.checked;
    }

    if (field.type === 'number' && target.value !== '') {
      value = Number(target.value);
    }

    if (field.type === 'multiple' && target instanceof HTMLSelectElement) {
      value = Array.from(target.selectedOptions).map((option) => option.value);
    }

    this.fieldChange.emit({ field, value });
  }

  onBlur(field: FormOption<unknown>): void {
    this.fieldBlur.emit({ field });
  }
}
