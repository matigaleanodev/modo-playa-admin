import { InputSignal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { BaseEntity } from '@core/models/entity.model';
import { FormOption } from '@core/models/form-option.model';
import { Validation } from '@core/models/validations.model';
import { ResourceService } from '@core/resource/resource.service';

export abstract class BaseForm<T extends BaseEntity> {
  abstract data: InputSignal<T>;

  abstract _service: ResourceService<T>;

  abstract readonly form: FormGroup;

  onSubmit(ev?: Event): void {
    if (this.form.valid) {
      this.guardar();
    } else {
      this.form.markAllAsTouched();
    }
  }

  guardar(): void {
    const formulario: T = this.form.getRawValue();
    this._service.guardar(formulario);
  }

  cancelar(): void {
    this._service.cancelar();
  }

  protected generateFormGroup(options: FormOption<any>[]): FormGroup {
    const group: Record<string, FormControl<any>> = {};

    for (const option of options) {
      const validators = this.mapValidaciones(option.validaciones);
      group[option.key] = new FormControl(
        { value: option.value ?? null, disabled: option.readonly },
        { validators },
      );
    }

    return new FormGroup(group);
  }

  private mapValidaciones(validaciones: Validation[]): ValidatorFn[] {
    return validaciones.map((v) => {
      const validatorFactory = VALIDATOR_MAP[v.tipo];
      return validatorFactory
        ? validatorFactory(v.valor)
        : Validators.nullValidator;
    });
  }

  getControl(key: string): FormControl<any> {
    const control = this.form.get(key);
    if (!(control instanceof FormControl)) {
      throw new Error(
        `El control con key "${key}" no es un FormControl o no existe.`,
      );
    }
    return control;
  }
}

const VALIDATOR_MAP: Record<string, (valor?: any) => ValidatorFn> = {
  required: () => Validators.required,
  email: () => Validators.email,
  minlength: (valor) => Validators.minLength(valor),
  maxlength: (valor) => Validators.maxLength(valor),
  pattern: (valor) => Validators.pattern(valor),
};
